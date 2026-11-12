"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { IconEye, IconMoreVertical, IconPencil, IconReceipt } from "@/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/dashboard/status-badge";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { formatDateTime, formatPhone, formatPrice } from "@/lib/format";
import type { OrderListRow } from "@/features/orders/types";
import {
  itemsPreview,
  orderReference,
  pluralizeItems,
  totalItemCount,
} from "@/features/orders/utils";
import { CopyButton } from "./copy-button";

export type OrdersTableProps = {
  rows: OrderListRow[];
  /** `true` when at least one filter is active. */
  isFiltered: boolean;
  /** `true` when the current session may change an order status. */
  canWrite: boolean;
  /** `true` while a filtered page is being fetched. */
  pending: boolean;
  onChangeStatus: (order: OrderListRow) => void;
  onClearFilters: () => void;
};

/**
 * «الطلبات» table.
 *
 * Column order follows the RTL reading order: the order reference comes first
 * (right side) and the row actions come last (left side).
 */
export function OrdersTable({
  rows,
  isFiltered,
  canWrite,
  pending,
  onChangeStatus,
  onClearFilters,
}: OrdersTableProps) {
  const router = useRouter();

  if (rows.length === 0) {
    return (
      <div className="rounded-lg bg-surface">
        {isFiltered ? (
          <EmptyState
            icon={<IconReceipt size={20} />}
            title="لا توجد نتائج مطابقة للفلاتر"
            description="لم نعثر على أي طلب يطابق البحث أو عوامل التصفية الحالية. جرّب تعديل كلمة البحث أو توسيع الفترة."
            action={
              <Button variant="secondary" onClick={onClearFilters}>
                مسح عوامل التصفية
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<IconReceipt size={20} />}
            title="لا توجد طلبات بعد"
            description="ستظهر الطلبات هنا فور وصولها إلى المنصة. لا يمكن إنشاء الطلبات من لوحة التحكم — يضيفها العميل من التطبيق."
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={
        pending
          ? "rounded-lg opacity-60 transition-opacity duration-150"
          : undefined
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>رقم الطلب</TableHead>
            <TableHead>العميل</TableHead>
            <TableHead>الأصناف</TableHead>
            <TableHead>الإجمالي</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>المندوب</TableHead>
            <TableHead>تاريخ الطلب</TableHead>
            <TableHead>إجراءات</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((order) => {
            const reference = orderReference(order.id);
            const itemCount = totalItemCount(order.items);

            return (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span
                      title={order.id}
                      className="tabular font-semibold text-foreground"
                    >
                      {reference}
                    </span>
                    <CopyButton value={order.id} label="رقم الطلب" />
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      profile={{
                        full_name: order.customer.fullName,
                        role: "customer",
                      }}
                      size="sm"
                    />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate font-medium text-foreground">
                        {order.customer.fullName ?? "عميل غير معروف"}
                      </span>
                      <span className="tabular truncate type-body-sm text-muted">
                        {order.customer.phoneNumber
                          ? formatPhone(order.customer.phoneNumber)
                          : "—"}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="type-body-md text-foreground">
                      {pluralizeItems(itemCount)}
                    </span>
                    <span
                      title={itemsPreview(order.items)}
                      className="truncate type-body-sm text-muted"
                    >
                      {itemsPreview(order.items)}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="tabular font-medium">
                  {formatPrice(order.totalPrice)}
                </TableCell>

                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>

                <TableCell className="text-muted">
                  {order.courierName ?? "لم يُحدَّد"}
                </TableCell>

                <TableCell className="whitespace-nowrap text-muted">
                  {formatDateTime(order.createdAt)}
                </TableCell>

                <TableCell>
                  <DropdownMenu
                    align="end"
                    trigger={
                      <span className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-secondary hover:text-foreground">
                        <IconMoreVertical size={18} />
                      </span>
                    }
                    items={[
                      {
                        label: "عرض التفاصيل",
                        icon: <IconEye size={16} />,
                        onSelect: () => router.push(`/dashboard/orders/${order.id}`),
                      },
                      ...(canWrite
                        ? [
                            {
                              label: "تغيير الحالة",
                              icon: <IconPencil size={16} />,
                              onSelect: () => onChangeStatus(order),
                            },
                          ]
                        : []),
                    ]}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default OrdersTable;
