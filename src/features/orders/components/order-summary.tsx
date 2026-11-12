import { formatPrice } from "@/lib/format";

export type OrderSummaryProps = {
  /** The sum of `price × quantity` over all item lines. */
  subtotal: number;
  /** `totalPrice - subtotal`. */
  deliveryFee: number;
  /** The total charged for the order. */
  totalPrice: number;
};

/**
 * «ملخص الأسعار» — the price breakdown of an order.
 *
 * The delivery fee is **derived** (`totalPrice - subtotal`), never hardcoded,
 * and it is only shown when the order actually carries one.
 */
export function OrderSummary({
  subtotal,
  deliveryFee,
  totalPrice,
}: OrderSummaryProps) {
  const hasDeliveryFee = deliveryFee > 0;

  return (
    <dl className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <dt className="type-body-md text-muted">مجموع الأصناف</dt>
        <dd className="tabular type-body-md text-foreground">
          {formatPrice(subtotal)}
        </dd>
      </div>

      {hasDeliveryFee ? (
        <div className="flex items-center justify-between gap-4">
          <dt className="type-body-md text-muted">رسوم التوصيل</dt>
          <dd className="tabular type-body-md text-foreground">
            {formatPrice(deliveryFee)}
          </dd>
        </div>
      ) : null}

      <div className="mt-1 flex items-center justify-between gap-4 border-t border-line/70 pt-3">
        <dt className="type-headline-sm text-foreground">الإجمالي</dt>
        <dd className="tabular type-headline-sm text-primary">
          {formatPrice(totalPrice)}
        </dd>
      </div>
    </dl>
  );
}

export default OrderSummary;
