"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconPackage } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { StatusDialog } from "@/features/orders/components/status-dialog";
import type { ActionResult } from "@/features/orders/types";

export type OrderDetailActionsProps = {
  /** The id of the order whose status is managed. */
  orderId: string;
  /** The short reference shown in the dialog, e.g. `#2F97C7`. */
  orderReference: string;
  /** The status the order currently has. */
  currentStatus: string;
  /**
   * `true` when the signed-in administrator holds `orders.write`.
   *
   * The authoritative check happens through RLS; this flag is a UI
   * affordance only and hides the action when it is `false`.
   */
  canWrite: boolean;
  /** Called after a successful status change so the parent can refresh. */
  onStatusUpdated?: () => void;
};

/**
 * «إجراءات الطلب» — the status management of a single order.
 *
 * `StatusDialog` owns its own `open` state, so it is wrapped here. After a
 * successful change the page is refreshed so the pipeline, the badge and the
 * totals always mirror what is stored on the server.
 */
export function OrderDetailActions({
  orderId,
  orderReference,
  currentStatus,
  canWrite,
  onStatusUpdated,
}: OrderDetailActionsProps) {
  const toast = useToast();

  const [open, setOpen] = useState(false);

  const handleUpdated = (result: ActionResult) => {
    if (result.ok) {
      toast.success(result.message);
      onStatusUpdated?.();
      return;
    }

    toast.error(result.error);
  };

  // The action is omitted entirely — not disabled — when the administrator
  // may only read the order.
  if (!canWrite) {
    return (
      <p className="type-body-sm text-muted">
        لا تملك صلاحية تعديل الطلبات — العرض فقط.
      </p>
    );
  }

  return (
    <>
      <Button
        variant="primary"
        icon={<IconPackage size={16} />}
        onClick={() => setOpen(true)}
        className="w-full justify-start"
      >
        تغيير حالة الطلب
      </Button>

      <StatusDialog
        open={open}
        onOpenChange={setOpen}
        orderId={orderId}
        orderReference={orderReference}
        currentStatus={currentStatus}
        onUpdated={handleUpdated}
      />
    </>
  );
}

export default OrderDetailActions;
