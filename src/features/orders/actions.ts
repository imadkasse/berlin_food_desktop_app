"use server";

import { revalidatePath } from "next/cache";

import { assertPermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateOrderStatus } from "@/services/orders";
import { isOrderId, isOrderStatus } from "@/features/orders/validation";
import type { ActionResult } from "@/features/orders/types";

export type { ActionResult };

/** The page that has to be refreshed after any mutation. */
const ORDERS_REVALIDATE_PATH = "/dashboard/orders";

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
  console.error("تعذّر تنفيذ عملية على الطلبات:", error);
  return "تعذّر تنفيذ العملية. حاول مرة أخرى.";
}

/**
 * Changes the status of an order.
 *
 * The permission is asserted on the server — the role is always read from the
 * server-side `profiles` row, never from the client.
 */
export async function updateOrderStatusAction(input: {
  orderId: string;
  status: string;
}): Promise<ActionResult> {
  try {
    await assertPermission("orders.write");

    const orderId = (input.orderId ?? "").trim();
    if (!isOrderId(orderId)) {
      return { ok: false, error: "معرّف الطلب غير صالح." };
    }

    if (!isOrderStatus(input.status)) {
      return { ok: false, error: "حالة الطلب غير صالحة." };
    }

    const admin = createAdminClient();
    await updateOrderStatus(admin, orderId, input.status);

    revalidatePath(ORDERS_REVALIDATE_PATH);
    revalidatePath(`${ORDERS_REVALIDATE_PATH}/${orderId}`);

    return { ok: true, message: "تم تحديث حالة الطلب" };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}
