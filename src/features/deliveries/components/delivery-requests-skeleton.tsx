import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholder shown while the delivery-requests page is loading.
 *
 * It mirrors the real layout (KPI row, filter bar, table) so the transition
 * does not jump.
 */
export function DeliveryRequestsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">جارٍ تحميل طلبات التوصيل…</span>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-80" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-lg" />
        ))}
      </div>

      <Skeleton className="h-[4.5rem] rounded-lg" />

      <div className="flex flex-col gap-3 rounded-lg bg-surface p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
    </div>
  );
}

export default DeliveryRequestsSkeleton;
