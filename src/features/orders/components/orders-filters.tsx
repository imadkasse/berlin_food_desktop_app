"use client";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { IconClose } from "@/components/ui/icons";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { ORDER_STATUS_LABELS, ORDER_STATUSES } from "@/types/app";
import type {
  OrderPeriodFilter,
  OrderSortOption,
  OrderStatusFilter,
} from "@/features/orders/types";

export type OrdersFiltersProps = {
  search: string;
  status: OrderStatusFilter;
  period: OrderPeriodFilter;
  sort: OrderSortOption;
  /** `true` when at least one filter is active. */
  isFiltered: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: OrderStatusFilter) => void;
  onPeriodChange: (value: OrderPeriodFilter) => void;
  onSortChange: (value: OrderSortOption) => void;
  onClear: () => void;
};

const STATUS_OPTIONS = [
  { value: "all", label: "الكل" },
  ...ORDER_STATUSES.map((status) => ({
    value: status,
    label: ORDER_STATUS_LABELS[status],
  })),
];

const PERIOD_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "today", label: "اليوم" },
  { value: "7d", label: "آخر 7 أيام" },
  { value: "30d", label: "آخر 30 يوم" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "highest", label: "الأعلى قيمة" },
];

/**
 * «عوامل التصفية» — search, status, period and sort.
 *
 * The search is debounced by the parent (300 ms) before it reaches the
 * server; the three selects apply immediately.
 */
export function OrdersFilters({
  search,
  status,
  period,
  sort,
  isFiltered,
  onSearchChange,
  onStatusChange,
  onPeriodChange,
  onSortChange,
  onClear,
}: OrdersFiltersProps) {
  return (
    <FilterBar>
      <div className="flex min-w-[18rem] flex-1 flex-col gap-1.5">
        <span className="type-label text-foreground">بحث</span>
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="ابحث برقم الطلب أو اسم العميل"
          aria-label="ابحث برقم الطلب أو اسم العميل"
        />
      </div>

      <Select
        label="الحالة"
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as OrderStatusFilter)
        }
        options={STATUS_OPTIONS}
        containerClassName="w-full sm:w-48"
      />

      <Select
        label="الفترة"
        value={period}
        onChange={(event) =>
          onPeriodChange(event.target.value as OrderPeriodFilter)
        }
        options={PERIOD_OPTIONS}
        containerClassName="w-full sm:w-44"
      />

      <Select
        label="ترتيب"
        value={sort}
        onChange={(event) =>
          onSortChange(event.target.value as OrderSortOption)
        }
        options={SORT_OPTIONS}
        containerClassName="w-full sm:w-44"
      />

      <div className="self-end">
        <Button
          variant="ghost"
          onClick={onClear}
          disabled={!isFiltered}
          icon={<IconClose size={16} />}
        >
          مسح
        </Button>
      </div>
    </FilterBar>
  );
}

export default OrdersFilters;
