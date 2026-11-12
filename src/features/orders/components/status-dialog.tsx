"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { IconAlert, IconCheck } from "@/components/ui/icons";
import { ORDER_STATUS_LABELS } from "@/types/app";
import { updateOrderStatusAction } from "@/features/orders/actions";
import type { ActionResult } from "@/features/orders/types";

/**
 * One-line explanation shown under every status.
 *
 * The admin always sees what the selected state actually means before saving.
 */
const STATUS_DESCRIPTIONS: Record<string, string> = {
  pending: "وصل الطلب ولم يبدأ التحضير بعد.",
  preparing: "يجري تحضير الأصناف الآن في المطبخ.",
  ready_for_pickup: "الطلب جاهز وينتظر مندوب التوصيل.",
  out_for_delivery: "الطلب في الطريق إلى عنوان العميل.",
  delivered: "تم تسليم الطلب إلى العميل بنجاح.",
  cancelled: "أُلغي الطلب ولن يكتمل التوصيل.",
};

/** The statuses offered in the picker, in their natural order. */
const PIPELINE_STATUSES = [
  "pending",
  "preparing",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
] as const;

export type StatusDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The order whose status is being changed. */
  orderId: string;
  /** The reference shown in the dialog title, e.g. `#2F97C7`. */
  orderReference: string;
  /** The status the order currently has. */
  currentStatus: string;
  /**
   * Called after the status change attempt completes — on success and on
   * failure alike.
   *
   * The consumer owns the user feedback (the toast) and the refresh, so the
   * same message is never shown twice.
   */
  onUpdated?: (result: ActionResult) => void;
};

/**
 * «تغيير حالة الطلب» — the status picker.
 *
 * The six statuses are listed as radio-style options with an Arabic
 * explanation. Cancelling is visually separated and requires an explicit
 * confirmation, because it ends the order.
 */
export function StatusDialog({
  open,
  onOpenChange,
  orderId,
  orderReference,
  currentStatus,
  onUpdated,
}: StatusDialogProps) {
  const [selected, setSelected] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Re-sync the preselection whenever the dialog is opened for another order.
  useEffect(() => {
    if (open) setSelected(currentStatus);
  }, [open, currentStatus]);

  const persist = async (status: string) => {
    setSaving(true);
    try {
      const result = await updateOrderStatusAction({ orderId, status });

      // The dialog never toasts on its own: the consumer owns the feedback so
      // the same message is never shown twice.
      if (result.ok) {
        onUpdated?.(result);
        onOpenChange(false);
      } else {
        onUpdated?.(result);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (selected === "cancelled" && currentStatus !== "cancelled") {
      setConfirmCancel(true);
      return;
    }
    void persist(selected);
  };

  const isUnchanged = selected === currentStatus;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title="تغيير حالة الطلب"
        description={`حدّث حالة الطلب ${orderReference} — الحالة الحالية: ${ORDER_STATUS_LABELS[currentStatus as keyof typeof ORDER_STATUS_LABELS] ?? currentStatus}`}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              إلغاء
            </Button>
            <Button
              variant={selected === "cancelled" ? "danger" : "primary"}
              onClick={handleSave}
              loading={saving}
              disabled={isUnchanged}
            >
              حفظ الحالة
            </Button>
          </>
        }
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">اختر حالة الطلب الجديدة</legend>

          {PIPELINE_STATUSES.map((status) => {
            const isSelected = selected === status;

            return (
              <label
                key={status}
                className={`flex cursor-pointer items-start gap-3 rounded-md p-3 transition-colors ${
                  isSelected
                    ? "bg-accent-soft ring-1 ring-primary/40"
                    : "bg-surface-secondary/60 hover:bg-surface-hover"
                }`}
              >
                <input
                  type="radio"
                  name="order-status"
                  value={status}
                  checked={isSelected}
                  onChange={() => setSelected(status)}
                  className="sr-only"
                />

                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-[#FDF8F3]"
                      : "border-line bg-surface"
                  }`}
                >
                  {isSelected ? <IconCheck size={12} /> : null}
                </span>

                <span className="flex flex-col gap-0.5">
                  <span
                    className={`type-label ${isSelected ? "text-primary" : "text-foreground"}`}
                  >
                    {ORDER_STATUS_LABELS[status]}
                  </span>
                  <span className="type-body-sm text-muted">
                    {STATUS_DESCRIPTIONS[status]}
                  </span>
                </span>
              </label>
            );
          })}

          <div className="my-1 h-px bg-line" role="separator" />

          <label
            className={`flex cursor-pointer items-start gap-3 rounded-md p-3 transition-colors ${
              selected === "cancelled"
                ? "bg-danger-soft ring-1 ring-danger/40"
                : "bg-surface-secondary/60 hover:bg-surface-hover"
            }`}
          >
            <input
              type="radio"
              name="order-status"
              value="cancelled"
              checked={selected === "cancelled"}
              onChange={() => setSelected("cancelled")}
              className="sr-only"
            />

            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                selected === "cancelled"
                  ? "border-danger bg-danger text-[#FDF8F3]"
                  : "border-line bg-surface"
              }`}
            >
              {selected === "cancelled" ? <IconCheck size={12} /> : null}
            </span>

            <span className="flex flex-col gap-0.5">
              <span
                className={`type-label ${selected === "cancelled" ? "text-danger" : "text-foreground"}`}
              >
                {ORDER_STATUS_LABELS.cancelled}
              </span>
              <span className="type-body-sm text-muted">
                {STATUS_DESCRIPTIONS.cancelled}
              </span>
            </span>
          </label>

          {selected === "cancelled" && currentStatus !== "cancelled" ? (
            <p className="flex items-start gap-2 rounded-md bg-warning-soft p-3 type-body-sm text-warning">
              <IconAlert size={16} className="mt-0.5 shrink-0" />
              <span>
                إلغاء الطلب نهائي ولا يمكن التراجع عنه. سيطلب منك تأكيد قبل
                التنفيذ.
              </span>
            </p>
          ) : null}
        </fieldset>
      </Dialog>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="تأكيد إلغاء الطلب"
        description={`سيتم إلغاء الطلب ${orderReference} نهائيًا. لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="إلغاء الطلب"
        cancelLabel="تراجع"
        tone="danger"
        onConfirm={() => persist("cancelled")}
      />
    </>
  );
}

export default StatusDialog;
