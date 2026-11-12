import { PageHeader } from "@/components/dashboard/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/features/menu/components/product-grid-skeleton";

/**
 * Route-level loading state for the Menu page.
 *
 * Mirrors the real layout (header + category rail + filter bar + product grid)
 * so the transition into the page feels continuous. The grid itself is
 * rendered by the feature's `ProductGridSkeleton`, so the placeholder always
 * matches the real card layout.
 */
export default function MenuLoading() {
  return (
    <div
      dir="rtl"
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-live="polite"
    >
      <PageHeader
        title="القائمة"
        description="إدارة الأصناف والتصنيفات والأسعار وحالة التوفّر"
        actions={<Skeleton className="h-11 w-32 rounded-md" />}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Skeleton className="hidden h-72 w-full rounded-lg lg:block" />

        <div className="flex min-w-0 flex-col gap-4">
          <Skeleton className="h-[68px] w-full rounded-lg" />
          <Skeleton className="h-6 w-40" />

          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}
