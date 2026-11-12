import { IconImage } from "@/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber, formatPrice } from "@/lib/format";
import type { OrderItemInfo } from "@/features/orders/types";

export type OrderItemsTableProps = {
  items: OrderItemInfo[];
};

/**
 * «الأصناف المطلوبة» — the item lines of an order.
 *
 * The unit price is the **snapshot** taken when the order was placed. When
 * the menu price has changed since then, the difference is called out so the
 * admin is never surprised by the two numbers.
 */
export function OrderItemsTable({ items }: OrderItemsTableProps) {
  if (items.length === 0) {
    return (
      <p className="type-body-md text-muted">
        لا توجد أصناف مسجّلة لهذا الطلب.
      </p>
    );
  }

  return (
    <Table className="rounded-lg border-0">
      <TableHeader>
        <TableRow>
          <TableHead>الصورة</TableHead>
          <TableHead>الصنف</TableHead>
          <TableHead>الكمية</TableHead>
          <TableHead>سعر الوحدة</TableHead>
          <TableHead>الإجمالي</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {items.map((item, index) => {
          const lineTotal = (item.unitPrice ?? 0) * (item.quantity || 0);
          const priceChanged =
            item.currentPrice !== null &&
            item.unitPrice !== null &&
            item.currentPrice !== item.unitPrice;

          return (
            <TableRow key={item.id ?? `${item.menuItemId ?? "item"}-${index}`}>
              <TableCell>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name ?? "صورة الصنف"}
                    className="h-12 w-12 rounded-md bg-surface-secondary object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-secondary text-subtle"
                  >
                    <IconImage size={18} />
                  </span>
                )}
              </TableCell>

              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">
                    {item.name ?? "صنف محذوف"}
                  </span>
                  <span className="type-body-sm text-subtle">
                    {priceChanged
                      ? `السعر مسجّل وقت الطلب — السعر الحالي ${formatPrice(item.currentPrice)}`
                      : "السعر مسجّل وقت الطلب"}
                  </span>
                </div>
              </TableCell>

              <TableCell className="tabular">
                {formatNumber(item.quantity)}
              </TableCell>

              <TableCell className="tabular">
                {formatPrice(item.unitPrice)}
              </TableCell>

              <TableCell className="tabular font-medium">
                {formatPrice(lineTotal)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default OrderItemsTable;
