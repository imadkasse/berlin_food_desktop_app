"use client";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { IconRefresh } from "@/components/ui/icons";
import { FilterBar } from "@/components/dashboard/filter-bar";
import {
  ADMIN_ROLE_FILTER_LABELS,
  ADMIN_ROLE_FILTERS,
  type AdminRoleFilter,
} from "@/features/admins/types";

export type AdminsFiltersProps = {
  search: string;
  role: AdminRoleFilter;
  /** `true` when at least one filter is active. */
  isFiltered: boolean;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: AdminRoleFilter) => void;
  onClear: () => void;
};

const ROLE_OPTIONS = ADMIN_ROLE_FILTERS.map((role) => ({
  value: role,
  label: ADMIN_ROLE_FILTER_LABELS[role],
}));

/**
 * «عوامل التصفية» — search by name / e-mail / phone, plus the privileged role
 * the table is narrowed down to.
 *
 * The search is debounced by the parent (300 ms) before it reaches the
 * server; the role select applies immediately.
 */
export function AdminsFilters({
  search,
  role,
  isFiltered,
  onSearchChange,
  onRoleChange,
  onClear,
}: AdminsFiltersProps) {
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
        label="الدور"
        value={role}
        onChange={(event) => onRoleChange(event.target.value as AdminRoleFilter)}
        options={ROLE_OPTIONS}
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

export default AdminsFilters;
