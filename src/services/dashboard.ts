import { createServerClient } from "@/lib/supabase/server";

export type DashboardStats = {
  /** Number of orders created since midnight. */
  todayOrders: number;
  /** Revenue of today's non-cancelled orders. */
  todayRevenue: number;
  /** Orders currently being prepared. */
  preparingOrders: number;
  /** Delivery agents flagged as available. */
  availableDeliveries: number;
};

export type RecentOrder = {
  id: string;
  customerId: string | null;
  customerName: string;
  totalPrice: number;
  status: string;
  createdAt: string | null;
};

export type RecentDeliveryRequest = {
  id: string;
  fullName: string;
  phoneNumber: string;
  status: string;
  createdAt: string;
};

export type TopMenuItem = {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
};

/** Midnight of the current day, in the server's local timezone. */
function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Dashboard KPIs — computed from the real tables using the *session* client
 * (no service-role access).
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createServerClient();
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

  for (const result of [todayOrdersResult, preparingResult, deliveriesResult]) {
    if (result.error) throw result.error;
  }

  const todayRows = todayOrdersResult.data ?? [];
  const todayRevenue = todayRows
    .filter((row) => row.status !== "cancelled")
    .reduce((sum, row) => sum + Number(row.total_price ?? 0), 0);

  return {
    todayOrders: todayRows.length,
    todayRevenue,
    preparingOrders: preparingResult.count ?? 0,
    availableDeliveries: deliveriesResult.count ?? 0,
  };
}

/**
 * The most recent orders together with the customer's display name.
 */
export async function getRecentOrders(limit = 5): Promise<RecentOrder[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select("id, customer_id, total_price, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = data ?? [];
  const customerIds = Array.from(
    new Set(rows.map((row) => row.customer_id).filter((id): id is string => Boolean(id))),
  );

  const names = new Map<string, string>();

  if (customerIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", customerIds);

    if (profilesError) throw profilesError;

    for (const profile of profiles ?? []) {
      names.set(profile.id, profile.full_name ?? "عميل");
    }
  }

  return rows.map((row) => ({
    id: row.id,
    customerId: row.customer_id ?? null,
    customerName: row.customer_id ? (names.get(row.customer_id) ?? "عميل") : "عميل",
    totalPrice: Number(row.total_price ?? 0),
    status: row.status ?? "pending",
    createdAt: row.created_at ?? null,
  }));
}

/** The latest delivery requests (applications to become a delivery agent). */
export async function getRecentDeliveryRequests(
  limit = 5,
): Promise<RecentDeliveryRequest[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("delivery_requests")
    .select("id, full_name, phone_number, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name ?? "—",
    phoneNumber: row.phone_number ?? "—",
    status: row.status ?? "pending",
    createdAt: row.created_at,
  }));
}

/** The best selling menu items, ranked by the ordered quantity. */
export async function getTopMenuItems(limit = 5): Promise<TopMenuItem[]> {
  const supabase = await createServerClient();

  const { data: orderItems, error: orderItemsError } = await supabase
    .from("order_items")
    .select("menu_item_id, quantity, price");

  if (orderItemsError) throw orderItemsError;

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

  if (ranked.length === 0) return [];

  const { data: menuItems, error: menuItemsError } = await supabase
    .from("menu_items")
    .select("id, name")
    .in(
      "id",
      ranked.map((item) => item.id),
    );

  if (menuItemsError) throw menuItemsError;

  const names = new Map(
    (menuItems ?? []).map((item) => [item.id, item.name] as const),
  );

  return ranked.map((item) => ({
    id: item.id,
    name: names.get(item.id) ?? "صنف محذوف",
    quantity: item.quantity,
    revenue: item.revenue,
  }));
}
