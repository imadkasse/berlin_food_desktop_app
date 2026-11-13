"use client";

import { useCallback, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { IconAlert, IconClose, IconReceipt, IconStar, IconTruck } from "@/components/ui/icons";
import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { OrderStatusBadge } from "@/components/dashboard/status-badge";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import {
  formatDateTime,
  formatNumber,
  formatPhone,
  formatPrice,
} from "@/lib/format";
import { VEHICLE_LABELS } from "@/types/app";
import { usePermission } from "@/hooks/use-permission";
import { useOrderDetail } from "@/features/orders/hooks";
import {
  formatAddress,
  orderReference,
  pluralizeItems,
  totalItemCount,
} from "@/features/orders/utils";
import { CopyButton } from "./copy-button";
import { OrderDetailActions } from "./order-detail-actions";
import { OrderItemsTable } from "./order-items-table";
import { OrderPipeline } from "./order-pipeline";
import { OrderSummary } from "./order-summary";

export type OrderDetailDrawerProps = {
  orderId: string | null;
  onClose: () => void;
  onStatusUpdated?: () => void;
};

/**
 * «تفاصيل الطلب» — a slide-over drawer that replaces the dedicated detail
 * route and keeps the admin on the orders list.
 *
 * The drawer anchors to the logical end of the screen (left in RTL) and
 * renders the same information previously shown on `/dashboard/orders/[id]`.
 */
export function OrderDetailDrawer({
  orderId,
  onClose,
  onStatusUpdated,
}: OrderDetailDrawerProps) {
  const { detail, isLoading, error, refetch } = useOrderDetail(orderId);
  const canWrite = usePermission("orders.write");

  useEffect(() => {
    if (!orderId) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [orderId, onClose]);

  if (!orderId) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-[rgba(43,33,27,0.45)]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="absolute inset-y-0 end-0 flex w-full max-w-3xl flex-col bg-background shadow-[0_0_50px_-12px_rgba(43,33,27,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <OrderDetailDrawerSkeleton />
          ) : error ? (
            <div className="rounded-lg bg-surface">
              <EmptyState
                icon={<IconAlert size={22} />}
                title="تعذّر تحميل تفاصيل الطلب"
                description={error}
                action={
                  <Button variant="secondary" onClick={refetch}>
                    إعادة المحاولة
                  </Button>
                }
              />
            </div>
          ) : !detail ? (
            <div className="rounded-lg bg-surface">
              <EmptyState
                icon={<IconReceipt size={22} />}
                title="الطلب غير موجود"
                description="ربما تم حذفه أو أن الرابط غير صحيح."
                action={
                  <Button variant="secondary" onClick={onClose}>
                    العودة إلى الطلبات
                  </Button>
                }
              />
            </div>
          ) : (
            <OrderDetailDrawerContent
              detail={detail}
              canWrite={canWrite}
              refetch={refetch}
              onStatusUpdated={onStatusUpdated}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function OrderDetailDrawerContent({
  detail,
  canWrite,
  refetch,
  onStatusUpdated,
  onClose,
}: {
  detail: NonNullable<ReturnType<typeof useOrderDetail>["detail"]>;
  canWrite: boolean;
  refetch: () => Promise<void>;
  onStatusUpdated?: () => Promise<void> | void;
  onClose: () => void;
}) {
  const reference = orderReference(detail.id);
  const customerName = detail.customer.fullName ?? "عميل غير معروف";
  const deliveryAddress = formatAddress(detail.deliveryAddress);
  const itemCount = totalItemCount(detail.items);

  const courier = detail.courier;
  const vehicleLabel = courier?.vehicleType
    ? (VEHICLE_LABELS[courier.vehicleType] ?? courier.vehicleType)
    : null;
  const rating = courier?.deliveryRating ?? null;
  const ratingCount = courier?.numberRatings ?? 0;

  const handleStatusUpdated = useCallback(async () => {
    await refetch();
    await onStatusUpdated?.();
  }, [refetch, onStatusUpdated]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-5 rounded-lg bg-surface p-6">
        <PageHeader
          title={reference}
          description={`طلب من ${customerName}`}
          actions={
            <>
              <CopyButton value={detail.id} label="رقم الطلب" />
              <OrderStatusBadge status={detail.status} />
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق اللوحة"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface-secondary hover:text-foreground"
              >
                <IconClose size={18} />
              </button>
            </>
          }
        />

        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-line/70 pt-5">
          <dl className="flex flex-wrap items-center gap-x-8 gap-y-3 type-body-md text-muted">
            <div className="flex items-center gap-2">
              <dt className="text-subtle">تاريخ الطلب</dt>
              <dd className="text-foreground">
                {formatDateTime(detail.createdAt)}
              </dd>
            </div>

            <div className="flex items-center gap-2">
              <dt className="text-subtle">الأصناف</dt>
              <dd className="text-foreground">{pluralizeItems(itemCount)}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-1">
            <span className="type-label text-muted">إجمالي الطلب</span>
            <span className="tabular type-metric text-primary">
              {formatPrice(detail.totalPrice)}
            </span>
          </div>
        </div>
      </header>

      <OrderPipeline status={detail.status} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <Section
            title="الأصناف المطلوبة"
            description="كل صنف في الطلب بالسعر المسجّل وقت إتمامه."
            contentClassName="p-0"
          >
            <OrderItemsTable items={detail.items} />
          </Section>

          <Section
            title="ملخص الأسعار"
            description="مجموع الأصناف ورسوم التوصيل والمبلغ الإجمالي."
          >
            <OrderSummary
              subtotal={detail.subtotal}
              deliveryFee={detail.deliveryFee}
              totalPrice={detail.totalPrice}
            />
          </Section>
        </div>

        <aside className="flex flex-col gap-6">
          <Section
            title="بيانات العميل"
            description="بيانات التواصل والعنوان المسجّل في الطلب."
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  profile={{
                    full_name: detail.customer.fullName,
                    role: "customer",
                  }}
                  size="lg"
                />

                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate type-headline-sm text-foreground">
                    {customerName}
                  </span>
                  <span className="type-body-sm text-muted">عميل</span>
                </div>
              </div>

              <dl className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="type-label text-muted">رقم الهاتف</dt>
                  <dd className="type-body-md text-foreground">
                    {detail.customer.phoneNumber ? (
                      <a
                        href={`tel:${detail.customer.phoneNumber}`}
                        dir="ltr"
                        className="tabular transition-colors hover:text-primary"
                      >
                        {formatPhone(detail.customer.phoneNumber)}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="type-label text-muted">البريد الإلكتروني</dt>
                  <dd className="type-body-md text-foreground">
                    {detail.customer.email ? (
                      <a
                        href={`mailto:${detail.customer.email}`}
                        dir="ltr"
                        className="break-all transition-colors hover:text-primary"
                      >
                        {detail.customer.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="type-label text-muted">عنوان التوصيل</dt>
                  <dd className="type-body-md text-foreground">
                    {deliveryAddress ?? "موقع محدد"}
                  </dd>
                </div>
              </dl>
            </div>
          </Section>

          <Section
            title="بيانات المندوب"
            description="المندوب المسؤول عن توصيل هذا الطلب."
          >
            {courier ? (
              <dl className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="type-label text-muted">الاسم</dt>
                  <dd className="type-body-md text-foreground">
                    {courier.fullName ?? "—"}
                  </dd>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="type-label text-muted">رقم الهاتف</dt>
                  <dd className="type-body-md text-foreground">
                    {courier.phoneNumber ? (
                      <a
                        href={`tel:${courier.phoneNumber}`}
                        dir="ltr"
                        className="tabular transition-colors hover:text-primary"
                      >
                        {formatPhone(courier.phoneNumber)}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="type-label text-muted">مركبة التوصيل</dt>
                  <dd className="type-body-md text-foreground">
                    {vehicleLabel ?? "غير محدد"}
                  </dd>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="type-label text-muted">التقييم</dt>
                  <dd className="type-body-md text-foreground">
                    {rating === null ? (
                      <span className="text-muted">لا توجد تقييمات بعد</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden="true" className="text-accent">
                          <IconStar size={14} />
                        </span>
                        <span className="tabular">{formatNumber(rating)}</span>
                        <span className="text-muted">
                          {ratingCount > 0
                            ? `من ${formatNumber(ratingCount)} تقييم`
                            : "تقييم"}
                        </span>
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="flex items-center gap-2 type-body-md text-muted">
                <IconTruck size={16} className="text-subtle" />
                لم يُحدَّد مندوب بعد
              </p>
            )}
          </Section>

          <Section
            title="إجراءات"
            description="تحديث حالة الطلب أثناء تنقله بين مراحل التوصيل."
            contentClassName="flex flex-col gap-2"
          >
            <OrderDetailActions
              orderId={detail.id}
              orderReference={reference}
              currentStatus={detail.status}
              canWrite={canWrite}
              onStatusUpdated={handleStatusUpdated}
            />
          </Section>
        </aside>
      </div>
    </div>
  );
}

function OrderDetailDrawerSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">جارٍ تحميل تفاصيل الطلب…</span>

      <div className="flex flex-col gap-5 rounded-lg bg-surface p-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-64" />
        </div>

        <Skeleton className="h-16 w-full" />
      </div>

      <Skeleton className="h-28 w-full rounded-lg" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-36 w-full rounded-lg" />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-52 w-full rounded-lg" />
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-36 w-full rounded-lg" />
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
