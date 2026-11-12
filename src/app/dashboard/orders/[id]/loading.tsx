import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton of the order detail page.
 *
 * It mirrors the real layout (header block, status pipeline and the two
 * columns) so the transition does not jump when the order arrives.
 */
export default function OrderDetailLoading() {
  return (
    <div
      dir="rtl"
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-live="polite"
    >
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
