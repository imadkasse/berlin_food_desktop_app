"use client";

import { createClient } from "@/lib/supabase/client";
import { toArabicError } from "@/lib/api/edge";
import { isOrderId, isOrderStatus } from "@/features/orders/validation";
import type { ActionResult } from "@/features/orders/types";

/**
 * Changes the status of an order using the browser Supabase client.
 *
 * The actual permission check is enforced by Row Level Security on the
 * `orders` table (`is_admin()`), so the caller role is never trusted from
 * the client.
 */
export async function updateOrderStatus({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}): Promise<ActionResult> {
  const id = (orderId ?? "").trim();

  if (!isOrderId(id)) {
    return { ok: false, error: "معرّف الطلب غير صالح." };
  }

  if (!isOrderStatus(status)) {
    return { ok: false, error: "حالة الطلب غير صالحة." };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (error) throw error;

    return { ok: true, message: "تم تحديث حالة الطلب" };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}
