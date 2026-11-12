"use client";

import { FilterBar } from "@/components/dashboard/filter-bar";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";

import type { AvailabilityFilter, MenuCategory, MenuSort } from "../types";

export type MenuFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  availability: AvailabilityFilter;
  onAvailabilityChange: (value: AvailabilityFilter) => void;
  /** `null` means "all categories". */
  categoryId: string | null;
  onCategoryChange: (value: string | null) => void;
  sort: MenuSort;
  onSortChange: (value: MenuSort) => void;
  categories: MenuCategory[];
};

const AVAILABILITY_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "available", label: "متاح" },
  { value: "unavailable", label: "غير متاح" },
];

const SORT_OPTIONS = [
  { value: "name", label: "الاسم" },
  { value: "price-asc", label: "السعر الأقل" },
  { value: "latest", label: "الأحدث" },
];

/**
 * Toolbar above the product grid: free-text search, availability, category and
 * sorting.
 */
export function MenuFilters({
  query,
  onQueryChange,
  availability,
  onAvailabilityChange,
  categoryId,
  onCategoryChange,
  sort,
  onSortChange,
  categories,
}: MenuFiltersProps) {
  return (
    <FilterBar>
      <div className="min-w-[240px] flex-1">
        <SearchInput
          value={query}
          onChange={onQueryChange}
          placeholder="ابحث عن صنف"
          aria-label="ابحث عن صنف"
        />
      </div>

      <div className="w-full sm:w-[170px]">
        <Select
          aria-label="تصفية حسب التوفّر"
          value={availability}
          onChange={(event) =>
            onAvailabilityChange(event.target.value as AvailabilityFilter)
          }
          options={AVAILABILITY_OPTIONS}
        />
      </div>

      <div className="w-full sm:w-[200px]">
        <Select
          aria-label="تصفية حسب التصنيف"
          value={categoryId ?? "all"}
          onChange={(event) =>
            onCategoryChange(
              event.target.value === "all" ? null : event.target.value,
            )
          }
          options={[
            { value: "all", label: "كل التصنيفات" },
            ...categories.map((category) => ({
              value: category.id,
              label: category.name,
            })),
          ]}
        />
      </div>

      <div className="w-full sm:w-[170px]">
        <Select
          aria-label="ترتيب الأصناف"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as MenuSort)}
          options={SORT_OPTIONS}
        />
      </div>
    </FilterBar>
  );
}

export default MenuFilters;
