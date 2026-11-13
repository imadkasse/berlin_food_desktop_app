"use client";

import { useCallback, useEffect, useState } from "react";

import { toArabicError } from "@/lib/api/edge";
import { PRIVILEGED_ROLES } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/client";
import { USERS_PAGE_SIZE, sanitizeSearchTerm } from "@/features/users/constants";
import type { AdminCounts, AdminFilters } from "@/features/admins/types";
import type { ProfileRow } from "@/types/app";

/**
 * Berlin Food — Admins read hooks.
 *
 * Every read runs with the **browser** Supabase client. The administrative
 * tier is only readable by accounts holding `admins.manage`, which Row Level
 * Security enforces regardless of what the UI renders.
 */

export type UsePrivilegedAccountsResult = {
  rows: ProfileRow[];
  count: number;
  page: number;
  pageSize: number;
  pageCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export type UseAdminCountsResult = {
  counts: AdminCounts;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const EMPTY_COUNTS: AdminCounts = {
  total: 0,
  superadmin: 0,
  admin: 0,
  manager: 0,
  support: 0,
};

/* -------------------------------------------------------------------------- */
/*                             Privileged accounts                            */
/* -------------------------------------------------------------------------- */

export function usePrivilegedAccounts(
  filters: AdminFilters,
): UsePrivilegedAccountsResult {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(USERS_PAGE_SIZE);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const activePage = Math.max(1, Math.floor(filters.page) || 1);
      const size = Math.max(
        1,
        Math.min(50, Math.floor(filters.pageSize) || USERS_PAGE_SIZE),
      );

      // Without a role filter the table shows the whole administrative tier.
      const roles: string[] =
        filters.role && filters.role !== "all"
          ? [filters.role]
          : [...PRIVILEGED_ROLES];

      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .in("role", roles);

      const term = sanitizeSearchTerm(filters.q ?? "");
      if (term) {
        query = query.or(
          `full_name.ilike.%${term}%,email.ilike.%${term}%,phone_number.ilike.%${term}%`,
        );
      }

      query = query.order("updated_at", {
        ascending: false,
        nullsFirst: false,
      });

      const {
        data,
        error: queryError,
        count: rawCount,
      } = await query.range((activePage - 1) * size, activePage * size - 1);

      if (queryError) throw queryError;

      let nextRows = data ?? [];
      const total = rawCount ?? nextRows.length;
      const computedPageCount = Math.max(1, Math.ceil(total / size));
      let currentPage = activePage;

      // The last page may have disappeared (e.g. an account was deleted) —
      // fall back instead of showing an empty table.
      if (
        nextRows.length === 0 &&
        total > 0 &&
        currentPage > computedPageCount
      ) {
        currentPage = computedPageCount;
        const clamped = await query.range(
          (currentPage - 1) * size,
          currentPage * size - 1,
        );

        if (clamped.error) throw clamped.error;
        nextRows = clamped.data ?? [];
      }

      setRows(nextRows);
      setCount(total);
      setPage(currentPage);
      setPageSize(size);
      setPageCount(computedPageCount);
    } catch (err) {
      setError(toArabicError(err));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  return {
    rows,
    count,
    page,
    pageSize,
    pageCount,
    isLoading,
    error,
    refetch: fetchAccounts,
  };
}

/* -------------------------------------------------------------------------- */
/*                                   Counts                                   */
/* -------------------------------------------------------------------------- */

export function useAdminCounts(): UseAdminCountsResult {
  const [counts, setCounts] = useState<AdminCounts>(EMPTY_COUNTS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const results = await Promise.all(
        PRIVILEGED_ROLES.map((role) =>
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", role),
        ),
      );

      for (const result of results) {
        if (result.error) throw result.error;
      }

      const nextCounts = {
        admin: 0,
        manager: 0,
        support: 0,
        superadmin: 0,
      };

      PRIVILEGED_ROLES.forEach((role, index) => {
        nextCounts[role] = results[index].count ?? 0;
      });

      const total = PRIVILEGED_ROLES.reduce(
        (sum, role) => sum + nextCounts[role],
        0,
      );

      setCounts({ ...nextCounts, total });
    } catch (err) {
      setError(toArabicError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCounts();
  }, [fetchCounts]);

  return {
    counts,
    isLoading,
    error,
    refetch: fetchCounts,
  };
}
