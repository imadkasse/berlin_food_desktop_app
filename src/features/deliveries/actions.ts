"use server";

import { revalidatePath } from "next/cache";

import { assertCanCreateRole, assertPermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  deleteDeliveryRequest,
  fetchDeliveryRequestById,
  fetchCourierOrders,
  insertDeliveryRequest,
  resolveCourierMatch,
  setProfileRole,
  updateDeliveryRequestStatus,
} from "@/services/deliveries";
import type { DeliveryRequestStatus, OrderRow } from "@/types/app";
import { isDeliveryStatus, validateDeliveryRequestInput } from "./validation";
import type { ActionResult, DetailResult } from "./types";

/** The page that has to be refreshed after any mutation. */
const DELIVERY_REVALIDATE_PATH = "/dashboard/delivery-requests";

/** Arabic success messages, one per status transition. */
const STATUS_SUCCESS_MESSAGES: Record<DeliveryRequestStatus, string> = {
  pending: "تم إرجاع الطلب إلى قيد المراجعة",
  approved: "تم قبول الطلب",
  rejected: "تم رفض الطلب",
};

/**
 * Turns any thrown error into an Arabic, user-facing message.
 *
 * Permission problems keep their dedicated wording; anything unexpected is
 * reported generically so no technical detail leaks into the UI.
 */
function toArabicError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "PermissionError" || error.name === "UnauthorizedError") {
      return error.message;
    }
  }
  console.error("تعذّر تنفيذ عملية على طلبات التوصيل:", error);
  return "تعذّر تنفيذ العملية. حاول مرة أخرى.";
}

/* -------------------------------------------------------------------------- */
/*                                Read (detail)                               */
/* -------------------------------------------------------------------------- */

/**
 * Loads the detail of a single delivery request for the side panel.
 *
 * The courier association and the delivery history are derived server-side so
 * the client never has to guess which account belongs to which request.
 */
export async function getDeliveryRequestDetailAction(input: {
  id: string;
}): Promise<DetailResult> {
  try {
    await assertPermission("deliveries.read");

    const id = (input.id ?? "").trim();
    if (!id) {
      return { ok: false, error: "معرّف طلب التوصيل غير صالح." };
    }

    const admin = createAdminClient();
    const request = await fetchDeliveryRequestById(admin, id);

    if (!request) {
      return { ok: false, error: "طلب التوصيل غير موجود." };
    }

    const match = await resolveCourierMatch(admin, request);

    let history: OrderRow[] = [];
    let historyTotal = 0;

    if (match?.isCourier) {
      const orders = await fetchCourierOrders(admin, match.profile.id);
      history = orders.rows;
      historyTotal = orders.total;
    }

    return {
      ok: true,
      detail: { request, match, history, historyTotal },
    };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Writes                                   */
/* -------------------------------------------------------------------------- */

/** Changes the status of a delivery request. */
export async function updateDeliveryRequestStatusAction(input: {
  id: string;
  status: string;
}): Promise<ActionResult> {
  try {
    await assertPermission("deliveries.write");

    const id = (input.id ?? "").trim();
    if (!id) {
      return { ok: false, error: "معرّف طلب التوصيل غير صالح." };
    }

    if (!isDeliveryStatus(input.status)) {
      return { ok: false, error: "حالة الطلب غير صالحة." };
    }

    const admin = createAdminClient();
    await updateDeliveryRequestStatus(admin, id, input.status);

    revalidatePath(DELIVERY_REVALIDATE_PATH);

    return { ok: true, message: STATUS_SUCCESS_MESSAGES[input.status] };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/** Deletes a delivery request permanently. */
export async function deleteDeliveryRequestAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    await assertPermission("deliveries.write");

    const id = (input.id ?? "").trim();
    if (!id) {
      return { ok: false, error: "معرّف طلب التوصيل غير صالح." };
    }

    const admin = createAdminClient();
    await deleteDeliveryRequest(admin, id);

    revalidatePath(DELIVERY_REVALIDATE_PATH);

    return { ok: true, message: "تم حذف طلب التوصيل" };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/** Creates a new delivery request. It is always created as `pending`. */
export async function createDeliveryRequestAction(input: {
  fullName: string;
  phoneNumber: string;
  email?: string | null;
}): Promise<ActionResult> {
  try {
    await assertPermission("deliveries.write");

    const validation = validateDeliveryRequestInput(input);
    if (!validation.ok) {
      const firstError =
        validation.errors.fullName ??
        validation.errors.phoneNumber ??
        validation.errors.email;
      return { ok: false, error: firstError ?? "بيانات الطلب غير صالحة." };
    }

    const admin = createAdminClient();
    await insertDeliveryRequest(admin, validation.data);

    revalidatePath(DELIVERY_REVALIDATE_PATH);

    return { ok: true, message: "تم إنشاء طلب التوصيل" };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/**
 * Accepts a delivery request.
 *
 * When `promoteCourier` is set and the derived association points at an
 * account whose role is `customer`, that account is promoted to `delivery`.
 * The promotion is a privileged role change, so it is additionally guarded by
 * `assertCanCreateRole("delivery")` and performed through the service-role
 * client (the `authenticated` role has no grant on `profiles.role`).
 *
 * An account that already holds a privileged role is left untouched.
 */
export async function approveDeliveryRequestAction(input: {
  id: string;
  promoteCourier?: boolean;
}): Promise<ActionResult> {
  try {
    await assertPermission("deliveries.write");

    const id = (input.id ?? "").trim();
    if (!id) {
      return { ok: false, error: "معرّف طلب التوصيل غير صالح." };
    }

    const admin = createAdminClient();
    const request = await fetchDeliveryRequestById(admin, id);

    if (!request) {
      return { ok: false, error: "طلب التوصيل غير موجود." };
    }

    let promoted = false;

    if (input.promoteCourier) {
      const match = await resolveCourierMatch(admin, request);
      const target = match?.profile ?? null;

      if (target && target.role === "customer") {
        // Guard the privileged role change before touching the database.
        await assertCanCreateRole("delivery");
        await setProfileRole(admin, target.id, "delivery");
        promoted = true;
      }
      // A courier account needs no promotion, and a privileged account is
      // never converted — both cases are skipped silently.
    }

    await updateDeliveryRequestStatus(admin, id, "approved");

    revalidatePath(DELIVERY_REVALIDATE_PATH);

    return {
      ok: true,
      message: promoted
        ? "تم قبول الطلب وترقية الحساب إلى مندوب توصيل"
        : STATUS_SUCCESS_MESSAGES.approved,
    };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}
