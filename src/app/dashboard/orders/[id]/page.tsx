import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { OrderStatusBadge } from "@/components/dashboard/status-badge";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { IconStar, IconTruck } from "@/components/ui/icons";
import { assertPermission } from "@/lib/auth/guard";
import { can } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import {
  formatDateTime,
  formatNumber,
  formatPhone,
  formatPrice,
} from "@/lib/format";
import { VEHICLE_LABELS } from "@/types/app";
import { loadOrderDetail } from "@/features/orders/queries";
import {
  formatAddress,
  orderReference,
  pluralizeItems,
  totalItemCount,
} from "@/features/orders/utils";
import { CopyButton } from "@/features/orders/components/copy-button";
import { OrderDetailActions } from "@/features/orders/components/order-detail-actions";
import { OrderItemsTable } from "@/features/orders/components/order-items-table";
import { OrderPipeline } from "@/features/orders/components/order-pipeline";
import { OrderSummary } from "@/features/orders/components/order-summary";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * «تفاصيل الطلب» — the server entry point of the order detail page.
 *
 * The order is loaded with the service-role client after the session and the
 * `orders.read` permission have been verified. A missing order is not a
 * crash: the page renders the friendly not-found state.
 */
export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await requireSession();
  await assertPermission("orders.read");

  const { id } = await params;
  const order = await loadOrderDetail(id);

  if (!order) {
    notFound();
  }

  const reference = orderReference(order.id);
  const customerName = order.customer.fullName ?? "عميل غير معروف";
  const deliveryAddress = formatAddress(order.deliveryAddress);
  const itemCount = totalItemCount(order.items);

  // The role is read from the server-side session — never from the client.
  const canWrite = can(session.role, "orders.write");

  const courier = order.courier;
  const vehicleLabel = courier?.vehicleType
    ? (VEHICLE_LABELS[courier.vehicleType] ?? courier.vehicleType)
    : null;
  const rating = courier?.deliveryRating ?? null;
  const ratingCount = courier?.numberRatings ?? 0;

  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <header className="flex flex-col gap-5 rounded-lg bg-surface p-6">
        <PageHeader
          title={reference}
          description={`طلب من ${customerName}`}
          actions={
            <>
              <CopyButton value={order.id} label="رقم الطلب" />
              <OrderStatusBadge status={order.status} />
            </>
          }
        />

        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-line/70 pt-5">
          <dl className="flex flex-wrap items-center gap-x-8 gap-y-3 type-body-md text-muted">
            <div className="flex items-center gap-2">
              <dt className="text-subtle">تاريخ الطلب</dt>
              <dd className="text-foreground">{formatDateTime(order.createdAt)}</dd>
            </div>

            <div className="flex items-center gap-2">
              <dt className="text-subtle">الأصناف</dt>
              <dd className="text-foreground">{pluralizeItems(itemCount)}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-1">
            <span className="type-label text-muted">إجمالي الطلب</span>
            <span className="tabular type-metric text-primary">
              {formatPrice(order.totalPrice)}
            </span>
          </div>
        </div>
      </header>

      <OrderPipeline status={order.status} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <Section
            title="الأصناف المطلوبة"
            description="كل صنف في الطلب بالسعر المسجّل وقت إتمامه."
            contentClassName="p-0"
          >
            <OrderItemsTable items={order.items} />
          </Section>

          <Section
            title="ملخص الأسعار"
            description="مجموع الأصناف ورسوم التوصيل والمبلغ الإجمالي."
          >
            <OrderSummary
              subtotal={order.subtotal}
              deliveryFee={order.deliveryFee}
              totalPrice={order.totalPrice}
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
                    full_name: order.customer.fullName,
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
                    {order.customer.phoneNumber ? (
                      <a
                        href={`tel:${order.customer.phoneNumber}`}
                        dir="ltr"
                        className="tabular transition-colors hover:text-primary"
                      >
                        {formatPhone(order.customer.phoneNumber)}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="type-label text-muted">البريد الإلكتروني</dt>
                  <dd className="type-body-md text-foreground">
                    {order.customer.email ? (
                      <a
                        href={`mailto:${order.customer.email}`}
                        dir="ltr"
                        className="break-all transition-colors hover:text-primary"
                      >
                        {order.customer.email}
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
              orderId={order.id}
              orderReference={reference}
              currentStatus={order.status}
              canWrite={canWrite}
            />
          </Section>
        </aside>
      </div>
    </div>
  );
}
