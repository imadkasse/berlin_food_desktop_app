import { PageHeader } from "@/components/dashboard/page-header";
import { Skeleton } from "@/components/ui/skeleton";

/** The number of columns of the admins table (used by the table skeleton). */
const TABLE_COLUMNS = 7;

/** The number of rows previewed by the table skeleton. */
const TABLE_ROWS = 6;

/**
 * Route-level loading state for the Administrators page.
 *
 * It mirrors the real layout (heading + notice + KPI row + filter bar +
 * table) so the transition into the page does not jump. The skeleton lives in
 * the route folder and is reused as the `Suspense` fallback of `page.tsx`, so
 * the route and the page always show the very same placeholder.
 */
export function AdminsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">جارٍ تحميل المشرفين…</span>

      <PageHeader
        title="المشرفون"
        description="إنشاء حسابات المشرفين وإدارة أدوارهم وصلاحياتهم"
        actions={<Skeleton className="h-11 w-32 rounded-md" />}
      />

      <Skeleton className="h-16 w-full rounded-lg" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-lg" />
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg bg-surface-secondary p-3">
        <div className="flex min-w-[18rem] flex-1 flex-col gap-1.5">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-11 w-full" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-11 w-48" />
        </div>

        <Skeleton className="h-11 w-20" />
      </div>

      <div className="overflow-hidden rounded-lg border border-line/70 bg-surface">
        <div className="flex items-center gap-4 bg-surface-secondary px-4 py-3">
          {Array.from({ length: TABLE_COLUMNS }).map((_, column) => (
            <Skeleton key={column} className="h-3 w-24" />
          ))}
        </div>

        <div className="flex flex-col divide-y divide-line/70">
          {Array.from({ length: TABLE_ROWS }).map((_, row) => (
            <div key={row} className="flex items-center gap-4 px-4 py-3">
              {Array.from({ length: TABLE_COLUMNS }).map((__, column) => (
                <Skeleton key={column} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminsLoading() {
  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <AdminsSkeleton />
    </div>
  );
}
