"use client";

import { useCallback, useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

export type TableSort = {
  key: string;
  direction: SortDirection;
};

export type UseTableStateOptions = {
  initialPage?: number;
  initialPageSize?: number;
  initialSort?: TableSort | null;
  /** Total number of rows — used to derive `pageCount`. */
  count?: number;
};

export type UseTableStateResult = {
  search: string;
  setSearch: (value: string) => void;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  pageCount: number;
  total: number;
  sort: TableSort | null;
  setSort: (sort: TableSort | null) => void;
  toggleSort: (key: string) => void;
  filters: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  resetFilters: () => void;
  reset: () => void;
  /** Builds the range clause for a Supabase query. */
  range: () => { from: number; to: number };
};

/**
 * Shared search / sort / pagination state for the list pages.
 */
export function useTableState(
  options: UseTableStateOptions = {},
): UseTableStateResult {
  const {
    initialPage = 1,
    initialPageSize = 10,
    initialSort = null,
    count,
  } = options;

  const [search, setSearchState] = useState("");
  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [sort, setSort] = useState<TableSort | null>(initialSort);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPageState(1);
  }, []);

  const setPage = useCallback((value: number) => {
    setPageState(Math.max(1, value));
  }, []);

  const setPageSize = useCallback((value: number) => {
    setPageSizeState(value);
    setPageState(1);
  }, []);

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((state) => ({ ...state, [key]: value }));
    setPageState(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
    setPageState(1);
  }, []);

  const reset = useCallback(() => {
    setSearchState("");
    setFilters({});
    setSort(initialSort);
    setPageState(initialPage);
    setPageSizeState(initialPageSize);
  }, [initialPage, initialPageSize, initialSort]);

  const toggleSort = useCallback((key: string) => {
    setSort((state) => {
      if (!state || state.key !== key) {
        return { key, direction: "asc" };
      }
      return {
        key,
        direction: state.direction === "asc" ? "desc" : "asc",
      };
    });
  }, []);

  const range = useCallback(
    () => ({
      from: (page - 1) * pageSize,
      to: page * pageSize - 1,
    }),
    [page, pageSize],
  );

  return useMemo(
    () => ({
      search,
      setSearch,
      page,
      setPage,
      pageSize,
      setPageSize,
      pageCount,
      total,
      sort,
      setSort,
      toggleSort,
      filters,
      setFilter,
      resetFilters,
      reset,
      range,
    }),
    [
      search,
      setSearch,
      page,
      setPage,
      pageSize,
      setPageSize,
      pageCount,
      total,
      sort,
      toggleSort,
      filters,
      setFilter,
      resetFilters,
      reset,
      range,
    ],
  );
}

export default useTableState;
