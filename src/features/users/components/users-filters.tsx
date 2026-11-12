"use client";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { IconRefresh } from "@/components/ui/icons";
import { FilterBar } from "@/components/dashboard/filter-bar";
import {
  USER_SORT_LABELS,
  USER_STATUS_LABELS,
  type UserSort,
  type UserStatusFilter,
} from "@/features/users/types";

export type UsersFiltersProps = {
  search: string;
  status: UserStatusFilter;
  sort: UserSort;
  /** `true` when at least one filter is active. */
  isFiltered: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: UserStatusFilter) => void;
  onSortChange: (value: UserSort) => void;
  onClear: () => void;
};

const STATUS_OPTIONS = [
  { value: "all", label: USER_STATUS_LABELS.all },
  { value: "active", label: USER_STATUS_LABELS.active },
  { value: "unavailable", label: USER_STATUS_LABELS.unavailable },
];

const SORT_OPTIONS = [
  { value: "updated_desc", label: USER_SORT_LABELS.updated_desc },
  { value: "name_asc", label: USER_SORT_LABELS.name_asc },
  { value: "role_asc", label: USER_SORT_LABELS.role_asc },
];

/**
 * «عوامل التصفية» — search by name / e-mail / phone, plus the status and the
 * sort order.
 *
 * The search is debounced by the parent (300 ms) before it reaches the
 * server; the two selects apply immediately.
 */
export function UsersFilters({
  search,
  status,
  sort,
  isFiltered,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onClear,
}: UsersFiltersProps) {
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
          onStatusChange(event.target.value as UserStatusFilter)
        }
        options={STATUS_OPTIONS}
        containerClassName="w-full sm:w-44"
      />

      <Select
        label="ترتيب"
        value={sort}
        onChange={(event) => onSortChange(event.target.value as UserSort)}
        options={SORT_OPTIONS}
        containerClassName="w-full sm:w-48"
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

export default UsersFilters;
