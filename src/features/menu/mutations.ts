import { createClient } from "@/lib/supabase/client";
import { toArabicError } from "@/lib/api/edge";

import type {
  ActionResult,
  CategoryPayload,
  ImageScope,
  ProductPayload,
} from "./types";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_NAME_LENGTH,
} from "./validation";

/**
 * Menu mutations driven by the browser Supabase client.
 *
 * RLS policies already restrict these operations to admin users; the payload is
 * validated here as well so the UI surfaces friendly Arabic errors instantly.
 */

const MENU_PATH = "menu_items";

/** Validates a product payload. Returns an Arabic error or `null`. */
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

/** Validates a category payload. Returns an Arabic error or `null`. */
function validateCategoryPayload(
  payload: CategoryPayload,
): { error: string } | null {
  const name = (payload.name ?? "").trim();

  if (!name) {
    return { error: "اسم التصنيف مطلوب" };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return {
      error: `اسم التصنيف طويل جدًا (${MAX_NAME_LENGTH} حرفًا كحد أقصى)`,
    };
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/*                                   Images                                    */
/* -------------------------------------------------------------------------- */

/**
 * Uploads a product / category image to the public `menu_items` bucket.
 *
 * The raw `File` object is uploaded directly; no base64 conversion is used.
 */
export async function uploadMenuImage(input: {
  file: File;
  scope: ImageScope;
}): Promise<ActionResult & { url?: string }> {
  const isAccepted = (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(
    input.file.type,
  );

  if (!isAccepted) {
    return { ok: false, error: "تعذّر رفع الصورة: الصيغة غير مدعومة" };
  }

  if (input.file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: "تعذّر رفع الصورة: الحجم يتجاوز 4 ميجابايت",
    };
  }

  if (input.file.size === 0) {
    return { ok: false, error: "تعذّر رفع الصورة: الملف فارغ" };
  }

  try {
    const supabase = createClient();

    const extension = input.file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const folder = input.scope === "category" ? "categories" : "products";
    const path = `menu_items/${folder}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from(MENU_PATH)
      .upload(path, input.file, {
        contentType: input.file.type,
        upsert: true,
      });

    if (error) {
      return { ok: false, error: "تعذّر رفع الصورة" };
    }

    const { data } = supabase.storage.from(MENU_PATH).getPublicUrl(path);

    return { ok: true, message: "تم رفع الصورة", url: data.publicUrl };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Products                                   */
/* -------------------------------------------------------------------------- */

/** Creates a new menu item. */
export async function createProduct(
  payload: ProductPayload,
): Promise<ActionResult> {
  const invalid = validateProductPayload(payload);

  if (invalid) {
    return { ok: false, error: invalid.error };
  }

  try {
    const supabase = createClient();

    const { error } = await supabase.from("menu_items").insert({
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

    return { ok: true, message: "تم حفظ الصنف بنجاح" };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/** Updates an existing menu item. */
export async function updateProduct(
  payload: ProductPayload & { id: string },
): Promise<ActionResult> {
  if (!payload.id) {
    return { ok: false, error: "الصنف غير موجود" };
  }

  const invalid = validateProductPayload(payload);

  if (invalid) {
    return { ok: false, error: invalid.error };
  }

  try {
    const supabase = createClient();

    const { error } = await supabase
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

    return { ok: true, message: "تم حفظ الصنف بنجاح" };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/**
 * Toggles the availability of a menu item without touching the other fields.
 *
 * Historical orders keep their own price snapshot, so flipping the switch is
 * always safe.
 */
export async function updateProductAvailability(payload: {
  id: string;
  isAvailable: boolean;
}): Promise<ActionResult> {
  if (!payload?.id) {
    return { ok: false, error: "الصنف غير موجود" };
  }

  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: payload.isAvailable })
      .eq("id", payload.id);

    if (error) {
      return { ok: false, error: "تعذّر تحديث حالة التوفّر" };
    }

    return {
      ok: true,
      message: payload.isAvailable
        ? "تم إتاحة الصنف للطلب"
        : "تم إيقاف الصنف عن الطلب",
    };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/**
 * Deletes a menu item.
 *
 * Orders keep their own price snapshot, so historical orders are not affected
 * by the deletion.
 */
export async function deleteProduct(payload: {
  id: string;
}): Promise<ActionResult> {
  if (!payload?.id) {
    return { ok: false, error: "الصنف غير موجود" };
  }

  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", payload.id);

    if (error) {
      return { ok: false, error: "تعذّر حذف الصنف" };
    }

    return { ok: true, message: "تم حذف الصنف بنجاح" };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Categories                                  */
/* -------------------------------------------------------------------------- */

/** Creates a new category. */
export async function createCategory(
  payload: CategoryPayload,
): Promise<ActionResult> {
  const invalid = validateCategoryPayload(payload);

  if (invalid) {
    return { ok: false, error: invalid.error };
  }

  try {
    const supabase = createClient();

    const { error } = await supabase.from("categories").insert({
      name: payload.name.trim(),
      image_url: payload.imageUrl || null,
    });

    if (error) {
      return { ok: false, error: "تعذّر حفظ التصنيف" };
    }

    return { ok: true, message: "تم حفظ التصنيف بنجاح" };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/** Updates an existing category. */
export async function updateCategory(
  payload: CategoryPayload & { id: string },
): Promise<ActionResult> {
  if (!payload?.id) {
    return { ok: false, error: "التصنيف غير موجود" };
  }

  const invalid = validateCategoryPayload(payload);

  if (invalid) {
    return { ok: false, error: invalid.error };
  }

  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("categories")
      .update({
        name: payload.name.trim(),
        image_url: payload.imageUrl || null,
      })
      .eq("id", payload.id);

    if (error) {
      return { ok: false, error: "تعذّر تحديث التصنيف" };
    }

    return { ok: true, message: "تم حفظ التصنيف بنجاح" };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/**
 * Deletes a category — but only when it is empty.
 *
 * A category that still holds items is refused so its items can never be
 * orphaned.
 */
export async function deleteCategory(payload: {
  id: string;
}): Promise<ActionResult> {
  if (!payload?.id) {
    return { ok: false, error: "التصنيف غير موجود" };
  }

  try {
    const supabase = createClient();

    const { count, error: countError } = await supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("category_id", payload.id);

    if (countError) {
      return { ok: false, error: "تعذّر حساب عدد الأصناف" };
    }

    if ((count ?? 0) > 0) {
      return {
        ok: false,
        error:
          "لا يمكن حذف تصنيف يحتوي على أصناف. انقل الأصناف إلى تصنيف آخر أولًا.",
      };
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", payload.id);

    if (error) {
      return { ok: false, error: "تعذّر حذف التصنيف" };
    }

    return { ok: true, message: "تم حذف التصنيف بنجاح" };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}
