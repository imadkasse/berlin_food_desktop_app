"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading placeholder for the product grid.
 *
 * Mirrors the real card layout (image tile + two text lines + action row) so
 * the page does not jump once the data arrives.
 */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex flex-col overflow-hidden rounded-lg bg-surface border border-line/70"
        >
          <Skeleton className="aspect-[16/10] w-full rounded-none" />

          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-2 h-7 w-24" />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line/70 px-4 py-3">
            <Skeleton className="h-6 w-24" />
            <div className="flex gap-1">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProductGridSkeleton;
