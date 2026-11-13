"use client";

import { createClient } from "@/lib/supabase/client";
import { invokeEdge, toArabicError } from "@/lib/api/edge";
import { isDeliveryStatus, validateDeliveryRequestInput } from "./validation";
import type { ActionResult } from "./types";

/** Arabic success messages, one per status transition. */
const STATUS_SUCCESS_MESSAGES: Record<string, string> = {
  pending: "تم إرجاع الطلب إلى قيد المراجعة",
  approved: "تم قبول الطلب",
  rejected: "تم رفض الطلب",
};

const INVALID_ID_ERROR = "معرّف طلب التوصيل غير صالح.";

type ApproveEdgeResult =
  | { ok: true; message: string; promoted?: boolean }
  | { ok: false; error: string };

/**
 * Changes the status of a delivery request.
 *
 * The authoritative permission check is enforced by Row Level Security on the
 * `delivery_requests` table, so the caller role is never trusted from the
 * client.
 */
export async function updateDeliveryStatus({
  id,
  status,
}: {
  id: string;
  status: string;
}): Promise<ActionResult> {
  const requestId = (id ?? "").trim();

  if (!requestId) {
    return { ok: false, error: INVALID_ID_ERROR };
  }

  if (!isDeliveryStatus(status)) {
    return { ok: false, error: "حالة الطلب غير صالحة." };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("delivery_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (error) throw error;

    return {
      ok: true,
      message: STATUS_SUCCESS_MESSAGES[status] ?? "تم تحديث حالة الطلب",
    };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/** Deletes a delivery request permanently. */
export async function deleteDeliveryRequest({
  id,
}: {
  id: string;
}): Promise<ActionResult> {
  const requestId = (id ?? "").trim();

  if (!requestId) {
    return { ok: false, error: INVALID_ID_ERROR };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("delivery_requests")
      .delete()
      .eq("id", requestId);

    if (error) throw error;

    return { ok: true, message: "تم حذف طلب التوصيل" };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/** Creates a new delivery request. It is always created as `pending`. */
export async function createDeliveryRequest({
  fullName,
  phoneNumber,
  email,
}: {
  fullName: string;
  phoneNumber: string;
  email?: string | null;
}): Promise<ActionResult> {
  const validation = validateDeliveryRequestInput({
    fullName,
    phoneNumber,
    email,
  });

  if (!validation.ok) {
    const firstError =
      validation.errors.fullName ??
      validation.errors.phoneNumber ??
      validation.errors.email;

    return { ok: false, error: firstError ?? "بيانات الطلب غير صالحة." };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.from("delivery_requests").insert({
      full_name: validation.data.fullName,
      phone_number: validation.data.phoneNumber,
      email: validation.data.email,
      status: "pending",
    });

    if (error) throw error;

    return { ok: true, message: "تم إنشاء طلب التوصيل" };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/**
 * Accepts a delivery request through the `admin-approve-delivery` Edge
 * Function.
 *
 * The optional courier promotion is a privileged role change and therefore
 * never performed client-side: the Edge Function re-derives the account,
 * checks the caller's permissions and updates the role with the service-role
 * client.
 */
export async function approveDeliveryRequest({
  id,
  promoteCourier,
}: {
  id: string;
  promoteCourier?: boolean;
}): Promise<ActionResult> {
  const requestId = (id ?? "").trim();

  if (!requestId) {
    return { ok: false, error: INVALID_ID_ERROR };
  }

  try {
    const result = await invokeEdge<ApproveEdgeResult>("admin-approve-delivery", {
      id: requestId,
      promoteCourier: Boolean(promoteCourier),
    });

    if (!result || result.ok !== true) {
      return {
        ok: false,
        error:
          result && !result.ok && result.error
            ? result.error
            : "تعذّر اعتماد طلب التوصيل. حاول مرة أخرى.",
      };
    }

    return { ok: true, message: result.message };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}
