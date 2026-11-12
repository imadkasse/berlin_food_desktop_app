import { cn } from "@/lib/cn";
import { IconAlert, IconCheck } from "@/components/ui/icons";
import { ORDER_STATUS_LABELS } from "@/types/app";
import type { OrderStatus } from "@/types/app";

/**
 * The ordered stages of an order.
 *
 * Cancelling is **not** part of the sequence — it is a terminal state that
 * replaces the whole pipeline.
 */
const PIPELINE: OrderStatus[] = [
  "pending",
  "preparing",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
];

export type OrderPipelineProps = {
  status: string;
  className?: string;
};

/**
 * «مسار الطلب» — the horizontal status stepper.
 *
 * The stages read from right to left (RTL), the current stage is highlighted
 * with a filled primary dot, past stages are muted and future stages stay
 * hollow.
 */
export function OrderPipeline({ status, className }: OrderPipelineProps) {
  if (status === "cancelled") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg bg-danger-soft p-5",
          className,
        )}
      >
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger text-[#FDF8F3]"
        >
          <IconAlert size={18} />
        </span>

        <div className="flex flex-col gap-0.5">
          <p className="type-headline-sm text-danger">
            {ORDER_STATUS_LABELS.cancelled}
          </p>
          <p className="type-body-md text-muted">
            أُلغي هذا الطلب ولن يكتمل التوصيل.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = PIPELINE.indexOf(status as OrderStatus);

  // An unknown status is rendered as the first stage rather than crashing.
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <ol
      className={cn(
        "flex flex-col gap-4 rounded-lg bg-surface p-5 sm:flex-row sm:items-start sm:gap-0",
        className,
      )}
    >
      {PIPELINE.map((stage, index) => {
        const isCurrent = index === activeIndex;
        const isPast = index < activeIndex;
        const isFuture = index > activeIndex;

        return (
          <li
            key={stage}
            className="flex flex-1 items-center gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center"
          >
            <div className="flex w-full items-center gap-3 sm:flex-col sm:gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  isCurrent && "border-primary bg-primary text-[#FDF8F3]",
                  isPast && "border-transparent bg-surface-secondary text-muted",
                  isFuture && "border-line bg-transparent text-subtle",
                )}
              >
                {isPast ? (
                  <IconCheck size={14} />
                ) : isCurrent ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FDF8F3]" />
                ) : null}
              </span>

              <span
                className={cn(
                  "type-label",
                  isCurrent && "text-primary",
                  isPast && "text-muted",
                  isFuture && "text-subtle",
                )}
              >
                {ORDER_STATUS_LABELS[stage]}
              </span>
            </div>

            {index < PIPELINE.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "hidden h-0.5 flex-1 sm:block",
                  index < activeIndex ? "bg-primary/45" : "bg-line",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export default OrderPipeline;
