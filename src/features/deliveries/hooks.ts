"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { toArabicError } from "@/lib/api/edge";
import type {
  CourierMatch,
  DeliveryRequestDetail,
  DeliveryRequestFilters,
  DeliveryStats,
} from "@/features/deliveries/types";
import type { DeliveryRequestRow, OrderRow, ProfileRow } from "@/types/app";
import {
  buildDeliverySearchFilter,
  DELIVERY_HISTORY_LIMIT,
  DELIVERY_PAGE_SIZE,
  deliveryPeriodCutoff,
  digitsOnly,
} from "@/features/deliveries/utils";

type SupabaseClient = ReturnType<typeof createClient>;

export type UseDeliveryRequestsResult = {
  rows: DeliveryRequestRow[];
  count: number;
  page: number;
  pageSize: number;
  pageCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export type UseDeliveryStatsResult = {
  stats: DeliveryStats;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export type UseDeliveryDetailResult = {
  detail: DeliveryRequestDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/* -------------------------------------------------------------------------- */
/*                                    Filters                                 */
/* -------------------------------------------------------------------------- */

function buildListQuery(supabase: SupabaseClient, filters: DeliveryRequestFilters) {
  const page = Math.max(1, Math.floor(filters.page) || 1);
  const pageSize = Math.max(
    1,
    Math.min(50, Math.floor(filters.pageSize) || DELIVERY_PAGE_SIZE),
  );

  let query = supabase.from("delivery_requests").select("*", { count: "exact" });

  const search = buildDeliverySearchFilter(filters.q ?? "");
  if (search) {
    query = query.or(search);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const cutoff = deliveryPeriodCutoff(filters.period);
  if (cutoff) {
    query = query.gte("created_at", cutoff.toISOString());
  }

  return { query, page, pageSize };
}

/* -------------------------------------------------------------------------- */
/*                                   Requests                                 */
/* -------------------------------------------------------------------------- */

export function useDeliveryRequests(
  filters: DeliveryRequestFilters,
): UseDeliveryRequestsResult {
  const [rows, setRows] = useState<DeliveryRequestRow[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DELIVERY_PAGE_SIZE);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        query,
        page: activePage,
        pageSize: size,
      } = buildListQuery(supabase, filters);

      const from = (activePage - 1) * size;
      const to = activePage * size - 1;

      const {
        data: initialData,
        error: queryError,
        count: rawCount,
      } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (queryError) throw queryError;

      let data = initialData;
      const total = rawCount ?? (data ?? []).length;
      const computedPageCount = Math.max(1, Math.ceil(total / size));
      let currentPage = activePage;

      // The last page may have disappeared (e.g. a request was deleted) — fall
      // back to the last existing page instead of showing an empty table.
      if (
        (data ?? []).length === 0 &&
        total > 0 &&
        currentPage > computedPageCount
      ) {
        currentPage = computedPageCount;
        const clamped = await query
          .order("created_at", { ascending: false })
          .range((currentPage - 1) * size, currentPage * size - 1);

        if (clamped.error) throw clamped.error;
        data = clamped.data;
      }

      setRows(data ?? []);
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
    void fetchRequests();
  }, [fetchRequests]);

  return {
    rows,
    count,
    page,
    pageSize,
    pageCount,
    isLoading,
    error,
    refetch: fetchRequests,
  };
}

/* -------------------------------------------------------------------------- */
/*                                    Stats                                   */
/* -------------------------------------------------------------------------- */

export function useDeliveryStats(): UseDeliveryStatsResult {
  const [stats, setStats] = useState<DeliveryStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .from("delivery_requests")
        .select("status");

      if (queryError) throw queryError;

      const next: DeliveryStats = {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
      };

      for (const row of data ?? []) {
        next.total += 1;
        if (row.status === "pending") next.pending += 1;
        else if (row.status === "approved") next.approved += 1;
        else if (row.status === "rejected") next.rejected += 1;
      }

      setStats(next);
    } catch (err) {
      setError(toArabicError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

/* -------------------------------------------------------------------------- */
/*                              Courier matching                              */
/* -------------------------------------------------------------------------- */

/** Finds profiles whose e-mail equals `email` (case-insensitive). */
async function findProfilesByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<ProfileRow[]> {
  const target = email.trim();
  if (!target) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("email", target)
    .limit(5);

  if (error) throw error;
  return data ?? [];
}

/**
 * Finds profiles whose phone number equals `phone`.
 *
 * The exact match is tried first; when nothing is found the lookup falls back
 * to a digit-only comparison so that `067 541 6320` still finds `0675416320`.
 */
async function findProfilesByPhone(
  supabase: SupabaseClient,
  phone: string,
): Promise<ProfileRow[]> {
  const trimmed = phone.trim();
  if (!trimmed) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("phone_number", trimmed)
    .limit(20);

  if (error) throw error;
  if (data && data.length > 0) return data;

  const digits = digitsOnly(trimmed);
  if (digits.length < 4) return [];

  const { data: fuzzy, error: fuzzyError } = await supabase
    .from("profiles")
    .select("*")
    .ilike("phone_number", `%${digits}%`)
    .limit(100);

  if (fuzzyError) return [];

  return (fuzzy ?? []).filter(
    (profile) => digitsOnly(profile.phone_number ?? "") === digits,
  );
}

/**
 * Orders the candidates: a real courier beats a customer account, an e-mail
 * match beats a phone match, then the most recently updated profile wins.
 */
function compareMatches(a: CourierMatch, b: CourierMatch): number {
  if (a.isCourier !== b.isCourier) return a.isCourier ? -1 : 1;
  if (a.source !== b.source) return a.source === "email" ? -1 : 1;

  const aTime = a.profile.updated_at ? Date.parse(a.profile.updated_at) : 0;
  const bTime = b.profile.updated_at ? Date.parse(b.profile.updated_at) : 0;
  if (aTime !== bTime) return bTime - aTime;

  return a.profile.id.localeCompare(b.profile.id);
}

/**
 * Derives the courier account of a delivery request.
 *
 * There is **no foreign key** between `delivery_requests` and `profiles`, so
 * the association is derived:
 *   1. match on e-mail (exact, case-insensitive);
 *   2. match on phone number.
 *
 * Returns `null` when nothing matches — no association is ever invented.
 */
async function resolveCourierMatch(
  supabase: SupabaseClient,
  request: DeliveryRequestRow,
): Promise<CourierMatch | null> {
  const candidates: CourierMatch[] = [];
  const seen = new Set<string>();

  const push = (profile: ProfileRow, source: CourierMatch["source"]) => {
    if (seen.has(profile.id)) return;
    seen.add(profile.id);
    candidates.push({
      profile,
      source,
      isCourier: profile.role === "delivery",
    });
  };

  const email = request.email?.trim();
  if (email) {
    for (const profile of await findProfilesByEmail(supabase, email)) {
      push(profile, "email");
    }
  }

  const phone = request.phone_number?.trim();
  if (phone) {
    for (const profile of await findProfilesByPhone(supabase, phone)) {
      push(profile, "phone");
    }
  }

  if (candidates.length === 0) return null;

  return [...candidates].sort(compareMatches)[0];
}

/**
 * Loads the orders that were assigned to a courier, newest first.
 * This is the «سجل التوصيل» of the detail panel.
 */
async function fetchCourierOrders(
  supabase: SupabaseClient,
  courierId: string,
): Promise<{ rows: OrderRow[]; total: number }> {
  const { data, error, count } = await supabase
    .from("orders")
    .select(
      "id, customer_id, delivery_id, status, total_price, delivery_address, created_at, updated_at, delivery_rating",
      { count: "exact" },
    )
    .eq("delivery_id", courierId)
    .order("created_at", { ascending: false })
    .limit(DELIVERY_HISTORY_LIMIT);

  if (error) throw error;

  const rows = data ?? [];
  return { rows, total: count ?? rows.length };
}

/* -------------------------------------------------------------------------- */
/*                                   Detail                                   */
/* -------------------------------------------------------------------------- */

export function useDeliveryDetail(id: string | null): UseDeliveryDetailResult {
  const [detail, setDetail] = useState<DeliveryRequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async (requestId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data: request, error: requestError } = await supabase
        .from("delivery_requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle();

      if (requestError) throw requestError;
      if (!request) {
        throw new Error("طلب التوصيل غير موجود.");
      }

      const match = await resolveCourierMatch(supabase, request);

      let history: OrderRow[] = [];
      let historyTotal = 0;

      if (match?.isCourier) {
        const orders = await fetchCourierOrders(supabase, match.profile.id);
        history = orders.rows;
        historyTotal = orders.total;
      }

      setDetail({ request, match, history, historyTotal });
    } catch (err) {
      setDetail(null);
      setError(
        err instanceof Error && err.message === "طلب التوصيل غير موجود."
          ? err.message
          : toArabicError(err),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) {
      setDetail(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    void fetchDetail(id);
  }, [id, fetchDetail]);

  return {
    detail,
    isLoading,
    error,
    refetch: useCallback(async () => {
      if (!id) return;
      await fetchDetail(id);
    }, [id, fetchDetail]),
  };
}
