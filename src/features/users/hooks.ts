"use client";

import { useCallback, useEffect, useState } from "react";

import { toArabicError } from "@/lib/api/edge";
import { PRIVILEGED_ROLES } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/client";
import { USERS_PAGE_SIZE, sanitizeSearchTerm } from "@/features/users/constants";
import type {
  UserCounts,
  UserFilters,
  UserTab,
} from "@/features/users/types";
import { isUserId } from "@/features/users/validation";
import type { ProfileRow } from "@/types/app";

/**
 * Berlin Food — Users read hooks.
 *
 * Every read runs with the **browser** Supabase client, so Row Level Security
 * decides which rows (and columns) the signed-in administrator may see. The
 * search / order / range logic of the former server service is preserved.
 */

export type UseUsersResult = {
  rows: ProfileRow[];
  count: number;
  page: number;
  pageSize: number;
  pageCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export type UseUserCountsResult = {
  counts: UserCounts;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export type UseUserByIdResult = {
  user: ProfileRow | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const EMPTY_COUNTS: UserCounts = {
  all: 0,
  customers: 0,
  delivery: 0,
  admins: 0,
};

/** Maps a tab onto the `role` filter it applies. */
function tabRoleFilter(tab: UserTab): string[] | null {
  switch (tab) {
    case "customers":
      return ["customer"];
    case "delivery":
      return ["delivery"];
    case "admins":
      return [...PRIVILEGED_ROLES];
    case "all":
    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Users                                    */
/* -------------------------------------------------------------------------- */

export function useUsers(filters: UserFilters): UseUsersResult {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(USERS_PAGE_SIZE);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const activePage = Math.max(1, Math.floor(filters.page) || 1);
      const size = Math.max(
        1,
        Math.min(50, Math.floor(filters.pageSize) || USERS_PAGE_SIZE),
      );

      let query = supabase.from("profiles").select("*", { count: "exact" });

      const term = sanitizeSearchTerm(filters.q ?? "");
      if (term) {
        query = query.or(
          `full_name.ilike.%${term}%,email.ilike.%${term}%,phone_number.ilike.%${term}%`,
        );
      }

      const roles = tabRoleFilter(filters.tab);
      if (roles && roles.length === 1) {
        query = query.eq("role", roles[0]);
      } else if (roles) {
        query = query.in("role", roles);
      }

      if (filters.status === "active") {
        query = query.eq("availability_status", true);
      } else if (filters.status === "unavailable") {
        query = query.eq("availability_status", false);
      }

      switch (filters.sort) {
        case "name_asc":
          query = query
            .order("full_name", { ascending: true, nullsFirst: false })
            .order("updated_at", { ascending: false, nullsFirst: false });
          break;
        case "role_asc":
          query = query
            .order("role", { ascending: true, nullsFirst: false })
            .order("full_name", { ascending: true, nullsFirst: false });
          break;
        case "updated_desc":
        default:
          query = query.order("updated_at", {
            ascending: false,
            nullsFirst: false,
          });
          break;
      }

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
    void fetchUsers();
  }, [fetchUsers]);

  return {
    rows,
    count,
    page,
    pageSize,
    pageCount,
    isLoading,
    error,
    refetch: fetchUsers,
  };
}

/* -------------------------------------------------------------------------- */
/*                                   Counts                                   */
/* -------------------------------------------------------------------------- */

export function useUserCounts(): UseUserCountsResult {
  const [counts, setCounts] = useState<UserCounts>(EMPTY_COUNTS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const [all, customers, delivery, admins] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "customer"),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "delivery"),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .in("role", [...PRIVILEGED_ROLES]),
      ]);

      for (const result of [all, customers, delivery, admins]) {
        if (result.error) throw result.error;
      }

      setCounts({
        all: all.count ?? 0,
        customers: customers.count ?? 0,
        delivery: delivery.count ?? 0,
        admins: admins.count ?? 0,
      });
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

/* -------------------------------------------------------------------------- */
/*                                   Detail                                   */
/* -------------------------------------------------------------------------- */

export function useUserById(id: string | null): UseUserByIdResult {
  const [user, setUser] = useState<ProfileRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (queryError) throw queryError;
      setUser(data ?? null);
    } catch (err) {
      setError(toArabicError(err));
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) {
      setUser(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // A malformed id is rejected before the query: Postgres answers an
    // invalid uuid with a hard error, and the drawer must render the
    // «الحساب غير موجود» state instead of crashing.
    if (!isUserId(id)) {
      setUser(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    void fetchUser(id.trim());
  }, [id, fetchUser]);

  return {
    user,
    isLoading,
    error,
    refetch: useCallback(async () => {
      if (!id || !isUserId(id)) return;
      await fetchUser(id.trim());
    }, [id, fetchUser]),
  };
}
