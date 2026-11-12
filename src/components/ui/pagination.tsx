"use client";

import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { IconChevronLeft, IconChevronRight } from "@/components/ui/icons";

export type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  total?: number;
  pageSize?: number;
  className?: string;
};

/**
 * Builds a compact page list with ellipses, e.g. `1 … 4 5 6 … 12`.
 */
function buildPageList(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages: (number | "gap")[] = [1];

  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);

  if (start > 2) pages.push("gap");
  for (let index = start; index <= end; index += 1) pages.push(index);
  if (end < pageCount - 1) pages.push("gap");

  pages.push(pageCount);
  return pages;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  total,
  pageSize,
  className,
}: PaginationProps) {
  const safePageCount = Math.max(1, pageCount);
  const safePage = Math.min(Math.max(1, page), safePageCount);
  const pages = buildPageList(safePage, safePageCount);

  const from = total !== undefined && pageSize ? (safePage - 1) * pageSize + 1 : undefined;
  const to =
    total !== undefined && pageSize ? Math.min(safePage * pageSize, total) : undefined;

  return (
    <nav
      aria-label="التنقل بين الصفحات"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
        className,
      )}
    >
      {total !== undefined ? (
        <p className="type-body-sm text-muted tabular">
          {from !== undefined && to !== undefined
            ? `عرض ${formatNumber(from)}–${formatNumber(to)} من ${formatNumber(total)}`
            : `الإجمالي: ${formatNumber(total)}`}
        </p>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          aria-label="الصفحة السابقة"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md",
            "text-muted transition-colors",
            "hover:bg-surface-secondary hover:text-foreground",
            "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
          )}
        >
          <IconChevronRight size={18} />
        </button>

        {pages.map((entry, index) =>
          entry === "gap" ? (
            <span
              key={`gap-${index}`}
              aria-hidden="true"
              className="px-1 type-body-sm text-subtle"
            >
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-current={entry === safePage ? "page" : undefined}
              aria-label={`الصفحة ${entry}`}
              className={cn(
                "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2",
                "type-body-sm tabular transition-colors",
                entry === safePage
                  ? "bg-primary text-[#FDF8F3]"
                  : "text-muted hover:bg-surface-secondary hover:text-foreground",
              )}
            >
              {entry}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= safePageCount}
          aria-label="الصفحة التالية"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md",
            "text-muted transition-colors",
            "hover:bg-surface-secondary hover:text-foreground",
            "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
          )}
        >
          <IconChevronLeft size={18} />
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
