"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import type {
  DashboardStats,
  RecentDeliveryRequest,
  RecentOrder,
  TopMenuItem,
} from "./types";

/** Midnight of the current day, in the browser's local timezone. */
function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export type UseDashboardStatsResult = {
  data: DashboardStats;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Loads dashboard KPIs from the browser Supabase client.
 */
export function useDashboardStats(): UseDashboardStatsResult {
  const [data, setData] = useState<DashboardStats>({
    todayOrders: 0,
    todayRevenue: 0,
    preparingOrders: 0,
    availableDeliveries: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const today = startOfToday().toISOString();

      const [todayOrdersResult, preparingResult, deliveriesResult] = await Promise.all([
        supabase
          .from("orders")
          .select("total_price, status, created_at")
          .gte("created_at", today),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "preparing"),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "delivery")
          .eq("availability_status", true),
      ]);

      if (todayOrdersResult.error) {
        throw new Error(`تعذّر تحميل طلبات اليوم: ${todayOrdersResult.error.message}`);
      }

      if (preparingResult.error) {
        throw new Error(
          `تعذّر تحميل الطلبات قيد التحضير: ${preparingResult.error.message}`,
        );
      }

      if (deliveriesResult.error) {
        throw new Error(
          `تعذّر تحميل المندوبين المتاحين: ${deliveriesResult.error.message}`,
        );
      }

      const todayRows = todayOrdersResult.data ?? [];
      const todayRevenue = todayRows
        .filter((row) => row.status !== "cancelled")
        .reduce((sum, row) => sum + Number(row.total_price ?? 0), 0);

      setData({
        todayOrders: todayRows.length,
        todayRevenue,
        preparingOrders: preparingResult.count ?? 0,
        availableDeliveries: deliveriesResult.count ?? 0,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "تعذّر تحميل إحصائيات لوحة التحكم. حاول مرة أخرى.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  return { data, isLoading, error, refetch: fetchStats };
}

export type UseRecentOrdersResult = {
  data: RecentOrder[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Loads the most recent orders together with the customer's display name.
 */
export function useRecentOrders(limit = 5): UseRecentOrdersResult {
  const [data, setData] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data: rows, error: ordersError } = await supabase
        .from("orders")
        .select("id, customer_id, total_price, status, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (ordersError) {
        throw new Error(`تعذّر تحميل أحدث الطلبات: ${ordersError.message}`);
      }

      const orders = rows ?? [];
      const customerIds = Array.from(
        new Set(
          orders.map((row) => row.customer_id).filter((id): id is string => Boolean(id)),
        ),
      );

      const names = new Map<string, string>();

      if (customerIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", customerIds);

        if (profilesError) {
          throw new Error(`تعذّر تحميل بيانات العملاء: ${profilesError.message}`);
        }

        for (const profile of profiles ?? []) {
          names.set(profile.id, profile.full_name ?? "عميل");
        }
      }

      setData(
        orders.map((row) => ({
          id: row.id,
          customerId: row.customer_id ?? null,
          customerName: row.customer_id
            ? (names.get(row.customer_id) ?? "عميل")
            : "عميل",
          totalPrice: Number(row.total_price ?? 0),
          status: row.status ?? "pending",
          createdAt: row.created_at ?? null,
        })),
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "تعذّر تحميل أحدث الطلبات. حاول مرة أخرى.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  return { data, isLoading, error, refetch: fetchOrders };
}

export type UseRecentDeliveryRequestsResult = {
  data: RecentDeliveryRequest[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Loads the latest delivery requests (applications to become a delivery agent).
 */
export function useRecentDeliveryRequests(
  limit = 5,
): UseRecentDeliveryRequestsResult {
  const [data, setData] = useState<RecentDeliveryRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data: rows, error: requestsError } = await supabase
        .from("delivery_requests")
        .select("id, full_name, phone_number, status, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (requestsError) {
        throw new Error(`تعذّر تحميل طلبات التوصيل: ${requestsError.message}`);
      }

      setData(
        (rows ?? []).map((row) => ({
          id: row.id,
          fullName: row.full_name ?? "—",
          phoneNumber: row.phone_number ?? "—",
          status: row.status ?? "pending",
          createdAt: row.created_at,
        })),
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "تعذّر تحميل طلبات التوصيل. حاول مرة أخرى.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  return { data, isLoading, error, refetch: fetchRequests };
}

export type UseTopMenuItemsResult = {
  data: TopMenuItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Loads the best selling menu items, ranked by the ordered quantity.
 */
export function useTopMenuItems(limit = 5): UseTopMenuItemsResult {
  const [data, setData] = useState<TopMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data: orderItems, error: orderItemsError } = await supabase
        .from("order_items")
        .select("menu_item_id, quantity, price");

      if (orderItemsError) {
        throw new Error(`تعذّر تحميل عناصر الطلبات: ${orderItemsError.message}`);
      }

      const totals = new Map<string, { quantity: number; revenue: number }>();

      for (const item of orderItems ?? []) {
        if (!item.menu_item_id) continue;

        const quantity = Number(item.quantity ?? 0);
        const revenue = quantity * Number(item.price ?? 0);

        const current = totals.get(item.menu_item_id) ?? { quantity: 0, revenue: 0 };
        totals.set(item.menu_item_id, {
          quantity: current.quantity + quantity,
          revenue: current.revenue + revenue,
        });
      }

      const ranked = Array.from(totals.entries())
        .map(([id, totalsForItem]) => ({ id, ...totalsForItem }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit);

      if (ranked.length === 0) {
        setData([]);
        setIsLoading(false);
        return;
      }

      const { data: menuItems, error: menuItemsError } = await supabase
        .from("menu_items")
        .select("id, name")
        .in(
          "id",
          ranked.map((item) => item.id),
        );

      if (menuItemsError) {
        throw new Error(`تعذّر تحميل أسماء الأصناف: ${menuItemsError.message}`);
      }

      const names = new Map(
        (menuItems ?? []).map((item) => [item.id, item.name] as const),
      );

      setData(
        ranked.map((item) => ({
          id: item.id,
          name: names.get(item.id) ?? "صنف محذوف",
          quantity: item.quantity,
          revenue: item.revenue,
        })),
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "تعذّر تحميل الأصناف الأكثر مبيعًا. حاول مرة أخرى.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  return { data, isLoading, error, refetch: fetchItems };
}
