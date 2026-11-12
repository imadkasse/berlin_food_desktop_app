import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholder shown while the users page is loading.
 *
 * It mirrors the real layout (heading, tabs, filter bar, table) so the
 * transition does not jump.
 */
export function UsersSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">جارٍ تحميل المستخدمين…</span>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>

      <Skeleton className="h-12 w-full max-w-2xl rounded-lg" />

      <Skeleton className="h-[4.5rem] rounded-lg" />

      <div className="flex flex-col gap-3 rounded-lg bg-surface p-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
    </div>
  );
}

export default UsersSkeleton;
