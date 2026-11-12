"use client";

import { IconPackage } from "@/components/ui/icons";
import { OrderStatusBadge } from "@/components/dashboard/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatNumber, formatPrice, shortId } from "@/lib/format";
import type { OrderRow, ProfileRow } from "@/types/app";

export type DeliveryHistoryProps = {
  /** The matched courier — `null` when no account could be derived. */
  courier: ProfileRow | null;
  orders: OrderRow[];
  total: number;
};

/**
 * «سجل التوصيل» — the orders that were assigned to the matched courier.
 *
 * The history is derived from `orders.delivery_id = profiles.id`; it is empty
 * for requests without a courier account and that is stated explicitly.
 */
export function DeliveryHistory({ courier, orders, total }: DeliveryHistoryProps) {
  if (!courier) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg bg-surface-secondary/70 px-5 py-8 text-center">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-subtle"
        >
          <IconPackage size={18} />
        </span>
        <p className="type-headline-sm text-foreground">
          لا توجد طلبات توصيل مرتبطة بعد
        </p>
        <p className="type-body-md max-w-md text-muted">
          لا يمكن عرض سجل التوصيل قبل معرفة حساب المندوب المرتبط بهذا الطلب.
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg bg-surface-secondary/70 px-5 py-8 text-center">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-subtle"
        >
          <IconPackage size={18} />
        </span>
        <p className="type-headline-sm text-foreground">
          لا توجد طلبات توصيل مرتبطة بعد
        </p>
        <p className="type-body-md max-w-md text-muted">
          لم يُكلَّف هذا المندوب بأي طلب توصيل حتى الآن.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="type-body-sm text-muted">
        <span className="tabular">{formatNumber(total)}</span> طلب توصيل مرتبط بهذا
        المندوب.
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>مرجع الطلب</TableHead>
            <TableHead>التاريخ</TableHead>
            <TableHead>الإجمالي</TableHead>
            <TableHead>الحالة</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <span className="tabular type-label text-foreground">
                  {shortId(order.id)}
                </span>
              </TableCell>
              <TableCell className="text-muted">
                {formatDate(order.created_at)}
              </TableCell>
              <TableCell>
                <span className="tabular font-semibold text-foreground">
                  {formatPrice(order.total_price)}
                </span>
              </TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default DeliveryHistory;
