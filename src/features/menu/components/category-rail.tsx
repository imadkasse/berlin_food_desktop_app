"use client";

import { cn } from "@/lib/cn";
import { IconPackage, IconUtensils } from "@/components/ui/icons";
import { formatNumber } from "@/lib/format";

import type { MenuCategory } from "../types";

export type CategoryRailProps = {
  categories: MenuCategory[];
  /** `null` means "all categories". */
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
  /** Total number of items across every category. */
  totalItems: number;
  /** Opens the category-management dialog. */
  onManage: () => void;
  className?: string;
};

/**
 * Vertical category rail.
 *
 * Sits on the right (RTL start) and narrows the product area down to a single
 * category. The active entry is highlighted with the soft accent tone; the
 * count next to every label keeps the density informative without a table.
 */
export function CategoryRail({
  categories,
  selectedCategoryId,
  onSelect,
  totalItems,
  onManage,
  className,
}: CategoryRailProps) {
  return (
    <nav
      aria-label="تصنيفات القائمة"
      className={cn(
        "flex w-full flex-col gap-1 rounded-lg bg-surface-secondary/70 p-2",
        className,
      )}
    >
      {/* All items */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        aria-current={selectedCategoryId === null ? "true" : undefined}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5",
          "text-start transition-colors duration-150",
          selectedCategoryId === null
            ? "bg-accent-soft text-primary"
            : "text-muted hover:bg-surface-hover hover:text-foreground",
        )}
      >
        <span className="flex items-center gap-2.5">
          <IconPackage size={17} className="shrink-0" />
          <span className="type-label">كل الأصناف</span>
        </span>
        <span
          className={cn(
            "tabular type-body-sm",
            selectedCategoryId === null ? "text-primary" : "text-subtle",
          )}
        >
          {formatNumber(totalItems)}
        </span>
      </button>

      {/* Separator */}
      <div aria-hidden="true" className="my-1 h-px bg-line/70" />

      {/* Categories */}
      {categories.length === 0 ? (
        <p className="px-3 py-4 text-center type-body-sm text-subtle">
          لا توجد تصنيفات بعد. أضف أول تصنيف لتوزيع الأصناف.
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {categories.map((category) => {
            const isActive = selectedCategoryId === category.id;

            return (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() => onSelect(category.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5",
                    "text-start transition-colors duration-150",
                    isActive
                      ? "bg-accent-soft text-primary"
                      : "text-muted hover:bg-surface-hover hover:text-foreground",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <IconUtensils size={17} className="shrink-0" />
                    <span className="type-label truncate">{category.name}</span>
                  </span>
                  <span
                    className={cn(
                      "tabular type-body-sm",
                      isActive ? "text-primary" : "text-subtle",
                    )}
                  >
                    {formatNumber(category.itemCount)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Manage categories */}
      <div className="mt-2 pt-2">
        <button
          type="button"
          onClick={onManage}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-md px-3 py-2.5",
            "type-label text-muted transition-colors duration-150",
            "border border-dashed border-line hover:border-accent hover:text-primary",
          )}
        >
          <IconPackage size={16} />
          إدارة التصنيفات
        </button>
      </div>
    </nav>
  );
}

export default CategoryRail;
