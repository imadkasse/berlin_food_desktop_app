"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { IconAlert, IconCalendar, IconCheck, IconClock, IconClose, IconMail, IconPhone } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner";
import { DeliveryStatusBadge } from "@/components/dashboard/status-badge";
import { formatDateTime, formatPhone, formatRelativeTime } from "@/lib/format";
import { getDeliveryRequestDetailAction } from "@/features/deliveries/actions";
import type { DeliveryRequestDetail } from "@/features/deliveries/types";
import type { DeliveryRequestRow } from "@/types/app";
import { CourierAccountCard } from "./courier-account-card";
import { DeliveryHistory } from "./delivery-history";
import { SidePanel } from "./side-panel";

export type RequestDetailDialogProps = {
  request: DeliveryRequestRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canWrite: boolean;
  /** Resolves to `true` when the action succeeded. */
  onApprove: (id: string, promoteCourier: boolean) => Promise<boolean>;
  onReject: (id: string) => Promise<boolean>;
};

type DetailState =
  | { status: "loading" }
  | { status: "ready"; detail: DeliveryRequestDetail }
  | { status: "error"; error: string };

/**
 * «تفاصيل طلب التوصيل» — a right-side panel with the request data, the
 * derived courier account, the delivery history and the approval actions.
 */
export function RequestDetailDialog({
  request,
  open,
  onOpenChange,
  canWrite,
  onApprove,
  onReject,
}: RequestDetailDialogProps) {
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const [promoteCourier, setPromoteCourier] = useState(false);
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!open || !request) return;

    let cancelled = false;
    setState({ status: "loading" });

    void getDeliveryRequestDetailAction({ id: request.id }).then((result) => {
      if (cancelled) return;

      if (result.ok) {
        setState({ status: "ready", detail: result.detail });
      } else {
        setState({ status: "error", error: result.error });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, request, reloadToken]);

  useEffect(() => {
    if (open) setPromoteCourier(false);
  }, [open]);

  const detail = state.status === "ready" ? state.detail : null;
  const matchedProfile = detail?.match?.profile ?? null;
  const canPromote =
    canWrite &&
    Boolean(detail?.match) &&
    !detail?.match?.isCourier &&
    detail?.match?.profile.role === "customer";

  const handleApprove = async () => {
    if (!request) return;
    setBusy("approve");
    try {
      const succeeded = await onApprove(request.id, promoteCourier);
      // Refresh the panel so the new status is visible immediately.
      if (succeeded) setReloadToken((token) => token + 1);
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async () => {
    if (!request) return;
    setBusy("reject");
    try {
      const succeeded = await onReject(request.id);
      if (succeeded) setReloadToken((token) => token + 1);
    } finally {
      setBusy(null);
    }
  };

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title="تفاصيل طلب التوصيل"
      description={
        request
          ? `طلب بتاريخ ${formatDateTime(request.created_at)}`
          : undefined
      }
      footer={
        canWrite ? (
          <>
            <Button
              variant="secondary"
              onClick={handleReject}
              loading={busy === "reject"}
              disabled={busy === "approve"}
              icon={<IconClose size={16} />}
            >
              رفض الطلب
            </Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              loading={busy === "approve"}
              disabled={busy === "reject"}
              icon={<IconCheck size={16} />}
            >
              قبول الطلب
            </Button>
          </>
        ) : null
      }
    >
      {state.status === "loading" ? (
        <div className="flex items-center justify-center gap-3 py-16 text-muted">
          <Spinner size="md" />
          <p className="type-body-md">جارٍ تحميل تفاصيل الطلب…</p>
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-danger-soft px-5 py-10 text-center">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-danger"
          >
            <IconAlert size={18} />
          </span>
          <p className="type-headline-sm text-foreground">
            تعذّر تحميل تفاصيل الطلب
          </p>
          <p className="type-body-md text-muted">{state.error}</p>
        </div>
      ) : null}

      {detail ? (
        <div className="flex flex-col gap-6">
          {/* بيانات الطلب */}
          <section className="flex flex-col gap-3">
            <h3 className="type-headline-sm text-foreground">بيانات الطلب</h3>

            <div className="flex flex-col gap-3 rounded-lg bg-surface-secondary/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <p className="type-label text-muted">الاسم الكامل</p>
                  <p className="type-headline-sm text-foreground">
                    {detail.request.full_name}
                  </p>
                </div>
                <DeliveryStatusBadge status={detail.request.status} />
              </div>

              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <dt className="type-body-sm text-muted">رقم الهاتف</dt>
                  <dd>
                    <a
                      href={`tel:${detail.request.phone_number}`}
                      className="type-label inline-flex items-center gap-1.5 text-primary transition-colors hover:text-accent"
                    >
                      <IconPhone size={16} />
                      <span className="tabular">
                        {formatPhone(detail.request.phone_number)}
                      </span>
                    </a>
                  </dd>
                </div>

                <div className="flex flex-col gap-1">
                  <dt className="type-body-sm text-muted">البريد الإلكتروني</dt>
                  <dd>
                    {detail.request.email ? (
                      <a
                        href={`mailto:${detail.request.email}`}
                        className="type-label inline-flex items-center gap-1.5 break-all text-primary transition-colors hover:text-accent"
                      >
                        <IconMail size={16} />
                        {detail.request.email}
                      </a>
                    ) : (
                      <span className="type-label text-subtle">—</span>
                    )}
                  </dd>
                </div>

                <div className="flex flex-col gap-1">
                  <dt className="type-body-sm text-muted">تاريخ الطلب</dt>
                  <dd className="type-label inline-flex items-center gap-1.5 text-foreground">
                    <IconCalendar size={16} />
                    {formatDateTime(detail.request.created_at)}
                  </dd>
                </div>

                <div className="flex flex-col gap-1">
                  <dt className="type-body-sm text-muted">آخر تحديث</dt>
                  <dd className="type-label inline-flex items-center gap-1.5 text-foreground">
                    <IconClock size={16} />
                    {formatRelativeTime(detail.request.updated_at)}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* حساب المندوب */}
          <section className="flex flex-col gap-3">
            <h3 className="type-headline-sm text-foreground">حساب المندوب</h3>
            <CourierAccountCard
              match={detail.match}
              request={detail.request}
            />
          </section>

          {/* سجل التوصيل */}
          <section className="flex flex-col gap-3">
            <h3 className="type-headline-sm text-foreground">سجل التوصيل</h3>
            <DeliveryHistory
              courier={matchedProfile}
              orders={detail.history}
              total={detail.historyTotal}
            />
          </section>

          {/* قرارات الاعتماد */}
          {canWrite ? (
            <section className="flex flex-col gap-3">
              <h3 className="type-headline-sm text-foreground">قرارات الاعتماد</h3>

              <div className="flex flex-col gap-3 rounded-lg bg-surface-secondary/70 p-5">
                <p className="type-body-md text-muted">
                  قبول الطلب يعني انضمام المندوب إلى فريق التوصيل، ورفضه يعني
                  إغلاق الطلب دون استبعاد الحساب. القرار يظهر مباشرة في جدول
                  الطلبات.
                </p>

                {canPromote ? (
                  <label className="flex cursor-pointer items-start gap-3 rounded-md bg-surface px-4 py-3">
                    <input
                      type="checkbox"
                      checked={promoteCourier}
                      onChange={(event) => setPromoteCourier(event.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-primary"
                    />
                    <span className="flex flex-col gap-1">
                      <span className="type-label text-foreground">
                        تحويل الحساب المطابق إلى مندوب توصيل
                      </span>
                      <span className="type-body-sm text-muted">
                        الحساب «
                        {detail.match?.profile.full_name ?? "—"}» مسجّل حاليًا
                        بدور «عميل». تحويله يمنحه صلاحية استلام طلبات التوصيل.
                      </span>
                    </span>
                  </label>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </SidePanel>
  );
}

export default RequestDetailDialog;
