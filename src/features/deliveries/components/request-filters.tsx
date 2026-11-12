"use client";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { IconRefresh } from "@/components/ui/icons";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { DELIVERY_STATUS_LABELS } from "@/types/app";
import type {
  DeliveryPeriodFilter,
  DeliveryStatusFilter,
} from "@/features/deliveries/types";

export type RequestFiltersProps = {
  search: string;
  status: DeliveryStatusFilter;
  period: DeliveryPeriodFilter;
  isFiltered: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: DeliveryStatusFilter) => void;
  onPeriodChange: (value: DeliveryPeriodFilter) => void;
  onClear: () => void;
};

const STATUS_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "pending", label: DELIVERY_STATUS_LABELS.pending },
  { value: "approved", label: DELIVERY_STATUS_LABELS.approved },
  { value: "rejected", label: DELIVERY_STATUS_LABELS.rejected },
];

const PERIOD_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "today", label: "اليوم" },
  { value: "7d", label: "آخر 7 أيام" },
  { value: "30d", label: "آخر 30 يوم" },
];

/**
 * «عوامل التصفية» — search by name / e-mail / phone, status and period.
 *
 * The search is debounced by the parent (300 ms) before it reaches the
 * server; the two selects apply immediately.
 */
export function RequestFilters({
  search,
  status,
  period,
  isFiltered,
  onSearchChange,
  onStatusChange,
  onPeriodChange,
  onClear,
}: RequestFiltersProps) {
  return (
    <FilterBar>
      <div className="flex min-w-[16rem] flex-1 flex-col gap-1.5">
        <span className="type-label text-foreground">بحث</span>
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="ابحث بالاسم أو البريد أو رقم الهاتف"
          aria-label="ابحث بالاسم أو البريد أو رقم الهاتف"
        />
      </div>

      <Select
        label="الحالة"
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as DeliveryStatusFilter)
        }
        options={STATUS_OPTIONS}
        containerClassName="w-full sm:w-44"
      />

      <Select
        label="الفترة"
        value={period}
        onChange={(event) =>
          onPeriodChange(event.target.value as DeliveryPeriodFilter)
        }
        options={PERIOD_OPTIONS}
        containerClassName="w-full sm:w-44"
      />

      <div className="self-end">
        <Button
          variant="ghost"
          onClick={onClear}
          disabled={!isFiltered}
          icon={<IconRefresh size={16} />}
        >
          مسح
        </Button>
      </div>
    </FilterBar>
  );
}

export default RequestFilters;
