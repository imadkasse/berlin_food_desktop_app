"use server";

import { revalidatePath } from "next/cache";

import { assertPermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { countItemsInCategory } from "@/services/menu";

import type {
  ActionResult,
  CategoryPayload,
  ImageScope,
  ProductPayload,
} from "./types";
import { isItemAvailable } from "./utils";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_NAME_LENGTH,
} from "./validation";

/**
 * Menu server actions.
 *
 * Rules that apply to every action in this file:
 *  1. The permission is asserted on the server — the role is never trusted
 *     from the client.
 *  2. Every write goes through the service-role client so RLS cannot
 *     intermittently block a legitimate dashboard write.
 *  3. The payload is validated again on the server (never trust the client).
 *  4. `/dashboard/menu` is revalidated so the page re-renders with fresh data.
 */

const MENU_PATH = "/dashboard/menu";

/** Maximum length of a base64 payload that can still decode to 4 MB. */
const MAX_BASE64_LENGTH = Math.ceil(MAX_IMAGE_BYTES / 3) * 4;

/**
 * Turns any thrown error into an Arabic, user-facing message.
 *
 * Permission problems keep their dedicated wording — the guard already writes
 * it in Arabic — while anything unexpected is reported generically so that no
 * technical detail (SQL / PostgREST text) leaks into the UI.
 */
function toArabicError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "PermissionError" || error.name === "UnauthorizedError") {
      return error.message;
    }
  }
  console.error("تعذّر تنفيذ عملية على القائمة:", error);
  return "تعذّر تنفيذ العملية. حاول مرة أخرى.";
}

/**
 * Runs an action body and normalises thrown errors into an Arabic
 * {@link ActionResult} instead of a generic server error.
 */
async function guard(
  permission: Parameters<typeof assertPermission>[0],
  run: () => Promise<ActionResult>,
): Promise<ActionResult> {
  try {
    await assertPermission(permission);
    return await run();
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Images                                    */
/* -------------------------------------------------------------------------- */

/**
 * Uploads a product / category image to the public `menu_items` bucket.
 *
 * The client sends a raw base64 string (the `data:` prefix is stripped) so the
 * file never travels as a multipart body.
 */
export async function uploadMenuImageAction(input: {
  fileName: string;
  base64: string;
  contentType: string;
  scope: ImageScope;
}): Promise<ActionResult & { url?: string }> {
  return guard("menu.write", async () => {
    if (!input || typeof input.base64 !== "string" || !input.base64) {
      return { ok: false, error: "تعذّر رفع الصورة: لا توجد بيانات" };
    }

    const isAccepted = (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(
      input.contentType,
    );

    if (!isAccepted) {
      return { ok: false, error: "تعذّر رفع الصورة: الصيغة غير مدعومة" };
    }

    if (input.base64.length > MAX_BASE64_LENGTH) {
      return {
        ok: false,
        error: "تعذّر رفع الصورة: الحجم يتجاوز 4 ميجابايت",
      };
    }

    const cleanBase64 = input.base64.replace(/\s/g, "");

    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleanBase64)) {
      return { ok: false, error: "تعذّر رفع الصورة: بيانات غير صالحة" };
    }

    const buffer = Buffer.from(cleanBase64, "base64");

    if (buffer.length === 0) {
      return { ok: false, error: "تعذّر رفع الصورة: الملف فارغ" };
    }

    if (buffer.length > MAX_IMAGE_BYTES) {
      return {
        ok: false,
        error: "تعذّر رفع الصورة: الحجم يتجاوز 4 ميجابايت",
      };
    }

    const admin = createAdminClient();

    const extension = input.fileName.split(".").pop()?.toLowerCase() ?? "jpg";
    const folder = input.scope === "category" ? "categories" : "products";
    const path = `menu_items/${folder}/${crypto.randomUUID()}.${extension}`;

    const { error } = await admin.storage.from("menu_items").upload(path, buffer, {
      contentType: input.contentType,
      upsert: true,
    });

    if (error) {
      return { ok: false, error: "تعذّر رفع الصورة" };
    }

    const { data } = admin.storage.from("menu_items").getPublicUrl(path);

    return { ok: true, message: "تم رفع الصورة", url: data.publicUrl };
  });
}

/* -------------------------------------------------------------------------- */
/*                                  Products                                   */
/* -------------------------------------------------------------------------- */

/** Validates a product payload on the server. Returns an Arabic error or `null`. */
function validateProductPayload(
  payload: ProductPayload,
): { error: string } | null {
  const name = (payload.name ?? "").trim();

  if (!name) {
    return { error: "اسم الصنف مطلوب" };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return {
      error: `اسم الصنف طويل جدًا (${MAX_NAME_LENGTH} حرفًا كحد أقصى)`,
    };
  }

  const price = Number(payload.price);

  if (!Number.isFinite(price) || price <= 0) {
    return { error: "السعر يجب أن يكون أكبر من صفر" };
  }

  const description = (payload.description ?? "").trim();

  if (description.length > 500) {
    return { error: "الوصف طويل جدًا (500 حرف كحد أقصى)" };
  }

  return null;
}

/** Creates a new menu item. */
export async function createProductAction(
  payload: ProductPayload,
): Promise<ActionResult> {
  return guard("menu.write", async () => {
    const invalid = validateProductPayload(payload);

    if (invalid) {
      return { ok: false, error: invalid.error };
    }

    const admin = createAdminClient();

    const { error } = await admin.from("menu_items").insert({
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      price: Number(payload.price),
      category_id: payload.categoryId || null,
      image_url: payload.imageUrl || null,
      is_available: payload.isAvailable ?? true,
    });

    if (error) {
      return { ok: false, error: "تعذّر حفظ الصنف" };
    }

    revalidatePath(MENU_PATH);

    return { ok: true, message: "تم حفظ الصنف بنجاح" };
  });
}

/** Updates an existing menu item. */
export async function updateProductAction(
  payload: ProductPayload & { id: string },
): Promise<ActionResult> {
  return guard("menu.write", async () => {
    if (!payload.id) {
      return { ok: false, error: "الصنف غير موجود" };
    }

    const invalid = validateProductPayload(payload);

    if (invalid) {
      return { ok: false, error: invalid.error };
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from("menu_items")
      .update({
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
        price: Number(payload.price),
        category_id: payload.categoryId || null,
        image_url: payload.imageUrl || null,
        is_available: payload.isAvailable ?? true,
      })
      .eq("id", payload.id);

    if (error) {
      return { ok: false, error: "تعذّر تحديث الصنف" };
    }

    revalidatePath(MENU_PATH);

    return { ok: true, message: "تم حفظ الصنف بنجاح" };
  });
}

/**
 * Toggles the availability of a menu item without touching the other fields.
 *
 * Historical orders keep their own price snapshot, so flipping the switch is
 * always safe.
 */
export async function updateProductAvailabilityAction(payload: {
  id: string;
  isAvailable: boolean;
}): Promise<ActionResult> {
  return guard("menu.write", async () => {
    if (!payload?.id) {
      return { ok: false, error: "الصنف غير موجود" };
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from("menu_items")
      .update({ is_available: payload.isAvailable })
      .eq("id", payload.id);

    if (error) {
      return { ok: false, error: "تعذّر تحديث حالة التوفّر" };
    }

    revalidatePath(MENU_PATH);

    return {
      ok: true,
      message: payload.isAvailable
        ? "تم إتاحة الصنف للطلب"
        : "تم إيقاف الصنف عن الطلب",
    };
  });
}

/**
 * Deletes a menu item.
 *
 * Orders keep their own price snapshot, so historical orders are not affected
 * by the deletion.
 */
export async function deleteProductAction(payload: {
  id: string;
}): Promise<ActionResult> {
  return guard("menu.write", async () => {
    if (!payload?.id) {
      return { ok: false, error: "الصنف غير موجود" };
    }

    const admin = createAdminClient();

    const { error } = await admin.from("menu_items").delete().eq("id", payload.id);

    if (error) {
      return { ok: false, error: "تعذّر حذف الصنف" };
    }

    revalidatePath(MENU_PATH);

    return { ok: true, message: "تم حذف الصنف بنجاح" };
  });
}

/* -------------------------------------------------------------------------- */
/*                                 Categories                                  */
/* -------------------------------------------------------------------------- */

/** Creates a new category. */
export async function createCategoryAction(
  payload: CategoryPayload,
): Promise<ActionResult> {
  return guard("categories.write", async () => {
    const name = (payload.name ?? "").trim();

    if (!name) {
      return { ok: false, error: "اسم التصنيف مطلوب" };
    }

    if (name.length > MAX_NAME_LENGTH) {
      return {
        ok: false,
        error: `اسم التصنيف طويل جدًا (${MAX_NAME_LENGTH} حرفًا كحد أقصى)`,
      };
    }

    const admin = createAdminClient();

    const { error } = await admin.from("categories").insert({
      name,
      image_url: payload.imageUrl || null,
    });

    if (error) {
      return { ok: false, error: "تعذّر حفظ التصنيف" };
    }

    revalidatePath(MENU_PATH);

    return { ok: true, message: "تم حفظ التصنيف بنجاح" };
  });
}

/** Updates an existing category. */
export async function updateCategoryAction(
  payload: CategoryPayload & { id: string },
): Promise<ActionResult> {
  return guard("categories.write", async () => {
    if (!payload?.id) {
      return { ok: false, error: "التصنيف غير موجود" };
    }

    const name = (payload.name ?? "").trim();

    if (!name) {
      return { ok: false, error: "اسم التصنيف مطلوب" };
    }

    if (name.length > MAX_NAME_LENGTH) {
      return {
        ok: false,
        error: `اسم التصنيف طويل جدًا (${MAX_NAME_LENGTH} حرفًا كحد أقصى)`,
      };
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from("categories")
      .update({ name, image_url: payload.imageUrl || null })
      .eq("id", payload.id);

    if (error) {
      return { ok: false, error: "تعذّر تحديث التصنيف" };
    }

    revalidatePath(MENU_PATH);

    return { ok: true, message: "تم حفظ التصنيف بنجاح" };
  });
}

/**
 * Deletes a category — but only when it is empty.
 *
 * A category that still holds items is refused server-side so its items can
 * never be orphaned.
 */
export async function deleteCategoryAction(payload: {
  id: string;
}): Promise<ActionResult> {
  return guard("categories.write", async () => {
    if (!payload?.id) {
      return { ok: false, error: "التصنيف غير موجود" };
    }

    const count = await countItemsInCategory(payload.id);

    if (count > 0) {
      return {
        ok: false,
        error:
          "لا يمكن حذف تصنيف يحتوي على أصناف. انقل الأصناف إلى تصنيف آخر أولًا.",
      };
    }

    const admin = createAdminClient();

    const { error } = await admin.from("categories").delete().eq("id", payload.id);

    if (error) {
      return { ok: false, error: "تعذّر حذف التصنيف" };
    }

    revalidatePath(MENU_PATH);

    return { ok: true, message: "تم حذف التصنيف بنجاح" };
  });
}

/**
 * Re-reads a single item's availability — used by the client to confirm the
 * optimistic switch state after a write.
 */
export async function getProductAvailabilityAction(payload: {
  id: string;
}): Promise<ActionResult & { isAvailable?: boolean }> {
  return guard("menu.read", async () => {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("menu_items")
      .select("is_available")
      .eq("id", payload.id)
      .maybeSingle();

    if (error || !data) {
      return { ok: false, error: "تعذّر قراءة حالة التوفّر" };
    }

    return {
      ok: true,
      message: "تم تحديث حالة التوفّر",
      isAvailable: isItemAvailable(data),
    };
  });
}
