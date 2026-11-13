"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { toArabicError } from "@/lib/api/edge";
import type {
  OrderCourier,
  OrderDetail,
  OrderFilters,
  OrderItemInfo,
  OrderListRow,
  OrderStats,
} from "@/features/orders/types";
import {
  buildOrderSearchFilter,
  orderPeriodCutoff,
  ORDERS_PAGE_SIZE,
  parseOrderCustomer,
  parseOrderItems,
} from "@/features/orders/utils";

type SupabaseClient = ReturnType<typeof createClient>;

export type UseOrdersResult = {
  rows: OrderListRow[];
  count: number;
  page: number;
  pageSize: number;
  pageCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export type UseOrderStatsResult = {
  stats: OrderStats;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export type UseOrderDetailResult = {
  detail: OrderDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/* -------------------------------------------------------------------------- */
/*                                   Orders                                   */
/* -------------------------------------------------------------------------- */

function buildListQuery(supabase: SupabaseClient, filters: OrderFilters) {
  const page = Math.max(1, Math.floor(filters.page) || 1);
  const pageSize = Math.max(
    1,
    Math.min(50, Math.floor(filters.pageSize) || ORDERS_PAGE_SIZE),
  );

  let query = supabase
    .from("order_info")
    .select(
      "id, total_price, status, delivery_address, created_at, customer, items",
      { count: "exact" },
    );

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const cutoff = orderPeriodCutoff(filters.period);
  if (cutoff) {
    query = query.gte("created_at", cutoff.toISOString());
  }

  const search = buildOrderSearchFilter(filters.q ?? "");
  if (search) {
    query = query.or(search);
  }

  if (filters.sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (filters.sort === "highest") {
    query = query.order("total_price", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  return { query, page, pageSize };
}

async function fetchCourierNames(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;

  const { data, error } = await supabase
    .from("orders_with_profiles")
    .select("id, deliver_name")
    .in("id", ids);

  if (error) {
    console.error("تعذّر جلب أسماء مندوبي التوصيل:", error.message);
    return map;
  }

  for (const row of data ?? []) {
    if (!row.id) continue;
    const name = row.deliver_name?.trim();
    if (name) map.set(row.id, name);
  }

  return map;
}

export function useOrders(filters: OrderFilters): UseOrdersResult {
  const [rows, setRows] = useState<OrderListRow[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ORDERS_PAGE_SIZE);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { query, page: activePage, pageSize: size } = buildListQuery(
        supabase,
        filters,
      );

      const from = (activePage - 1) * size;
      const to = activePage * size - 1;

      const {
        data: initialData,
        error: queryError,
        count: rawCount,
      } = await query.range(from, to);

      if (queryError) throw queryError;

      let data = initialData;
      const total = rawCount ?? (data ?? []).length;
      const computedPageCount = Math.max(1, Math.ceil(total / size));
      let currentPage = activePage;

      // The last page may have disappeared — fall back instead of showing an
      // empty table.
      if ((data ?? []).length === 0 && total > 0 && currentPage > computedPageCount) {
        currentPage = computedPageCount;
        const clampedFrom = (currentPage - 1) * size;
        const clampedTo = currentPage * size - 1;
        const clamped = await query.range(clampedFrom, clampedTo);

        if (clamped.error) throw clamped.error;
        data = clamped.data;
      }

      const ids = (data ?? [])
        .map((row) => row.id)
        .filter((id): id is string => Boolean(id));

      const couriers = await fetchCourierNames(supabase, ids);

      const mappedRows: OrderListRow[] = (data ?? [])
        .filter((row): row is typeof row & { id: string } => Boolean(row.id))
        .map((row) => ({
          id: row.id,
          totalPrice: row.total_price ?? 0,
          status: row.status ?? "pending",
          createdAt: row.created_at ?? null,
          deliveryAddress: row.delivery_address ?? null,
          customer: parseOrderCustomer(row.customer ?? null),
          items: parseOrderItems(row.items ?? null),
          courierName: couriers.get(row.id) ?? null,
        }));

      setRows(mappedRows);
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
    void fetchOrders();
  }, [fetchOrders]);

  return {
    rows,
    count,
    page,
    pageSize,
    pageCount,
    isLoading,
    error,
    refetch: fetchOrders,
  };
}

/* -------------------------------------------------------------------------- */
/*                                    Stats                                   */
/* -------------------------------------------------------------------------- */

export function useOrderStats(): UseOrderStatsResult {
  const [stats, setStats] = useState<OrderStats>({
    today: 0,
    preparing: 0,
    outForDelivery: 0,
    deliveredToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const cutoff = orderPeriodCutoff("today");
      const todayStart = (cutoff ?? new Date()).toISOString();

      const [today, preparing, outForDelivery, deliveredToday] =
        await Promise.all([
          supabase
            .from("order_info")
            .select("id", { count: "exact", head: true })
            .gte("created_at", todayStart),
          supabase
            .from("order_info")
            .select("id", { count: "exact", head: true })
            .eq("status", "preparing"),
          supabase
            .from("order_info")
            .select("id", { count: "exact", head: true })
            .eq("status", "out_for_delivery"),
          supabase
            .from("order_info")
            .select("id", { count: "exact", head: true })
            .eq("status", "delivered")
            .gte("created_at", todayStart),
        ]);

      for (const result of [today, preparing, outForDelivery, deliveredToday]) {
        if (result.error) {
          console.error("تعذّر حساب إحصاءات الطلبات:", result.error.message);
        }
      }

      setStats({
        today: today.count ?? 0,
        preparing: preparing.count ?? 0,
        outForDelivery: outForDelivery.count ?? 0,
        deliveredToday: deliveredToday.count ?? 0,
      });
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
/*                                   Detail                                   */
/* -------------------------------------------------------------------------- */

async function fetchOrderItems(
  supabase: SupabaseClient,
  orderId: string,
): Promise<OrderItemInfo[]> {
  const { data, error } = await supabase
    .from("order_items")
    .select("id, quantity, price, menu_item:menu_items(id, name, price, image_url)")
    .eq("order_id", orderId);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const menuItem = Array.isArray(row.menu_item)
      ? row.menu_item[0]
      : row.menu_item;

    return {
      id: row.id,
      quantity: row.quantity ?? 0,
      unitPrice: row.price,
      name: menuItem?.name ?? null,
      menuItemId: menuItem?.id ?? null,
      imageUrl: menuItem?.image_url ?? null,
      currentPrice: menuItem?.price ?? null,
    };
  });
}

async function fetchOrderCourier(
  supabase: SupabaseClient,
  orderId: string,
): Promise<OrderCourier | null> {
  const { data: order, error: orderError } = await supabase
    .from("orders_with_profiles")
    .select("delivery_id, deliver_name")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    console.error("تعذّر جلب مندوب الطلب:", orderError.message);
    return null;
  }

  const deliveryId = order?.delivery_id ?? null;
  const name = order?.deliver_name?.trim() ?? null;

  if (!deliveryId) {
    return name
      ? {
          id: "",
          fullName: name,
          phoneNumber: null,
          vehicleType: null,
          deliveryRating: null,
          numberRatings: null,
        }
      : null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, full_name, phone_number, vehicle_type, delivery_rating, number_ratings",
    )
    .eq("id", deliveryId)
    .maybeSingle();

  if (profileError) {
    console.error("تعذّر جلب ملف المندوب:", profileError.message);
  }

  if (!profile) {
    return name
      ? {
          id: deliveryId,
          fullName: name,
          phoneNumber: null,
          vehicleType: null,
          deliveryRating: null,
          numberRatings: null,
        }
      : null;
  }

  return {
    id: profile.id,
    fullName: profile.full_name?.trim() || name,
    phoneNumber: profile.phone_number ?? null,
    vehicleType: profile.vehicle_type ?? null,
    deliveryRating: profile.delivery_rating ?? null,
    numberRatings: profile.number_ratings ?? null,
  };
}

export function useOrderDetail(id: string | null): UseOrderDetailResult {
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async (orderId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data: order, error: orderError } = await supabase
        .from("order_info")
        .select(
          "id, total_price, status, delivery_address, created_at, customer, items",
        )
        .eq("id", orderId)
        .maybeSingle();

      if (orderError) throw orderError;
      if (!order?.id) {
        setDetail(null);
        return;
      }

      const [items, courier] = await Promise.all([
        fetchOrderItems(supabase, order.id),
        fetchOrderCourier(supabase, order.id),
      ]);

      const totalPrice = order.total_price ?? 0;
      const subtotal = items.reduce(
        (sum, item) => sum + (item.unitPrice ?? 0) * (item.quantity || 0),
        0,
      );

      setDetail({
        id: order.id,
        totalPrice,
        status: order.status ?? "pending",
        createdAt: order.created_at ?? null,
        deliveryAddress: order.delivery_address ?? null,
        customer: parseOrderCustomer(order.customer ?? null),
        items,
        subtotal,
        deliveryFee: totalPrice - subtotal,
        courier,
      });
    } catch (err) {
      setError(toArabicError(err));
      setDetail(null);
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
