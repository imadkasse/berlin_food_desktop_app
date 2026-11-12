import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type FilterBarProps = {
  children: ReactNode;
  className?: string;
};

/**
 * A single horizontal row of filters (search + selects) on a warm tonal
 * background.
 */
export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg bg-surface-secondary p-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default FilterBar;
