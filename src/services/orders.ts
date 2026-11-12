import "server-only";

import type { SupabaseAdminClient } from "@/lib/supabase/admin";
import type { Paginated } from "@/types/app";
import type {
  OrderCourier,
  OrderDetail,
  OrderFilters,
  OrderItemInfo,
  OrderListRow,
  OrderPeriodFilter,
  OrderStats,
} from "@/features/orders/types";
import {
  parseOrderCustomer,
  parseOrderItems,
} from "@/features/orders/utils";

/**
 * Data-access layer for the orders feature.
 *
 * Everything here runs with the service-role client, so the callers are
 * responsible for the permission assertions (see `src/features/orders/queries.ts`).
 *
 * The list is read from the `order_info` view, which exposes the customer and
 * the ordered items as JSON columns. The courier name comes from
 * `orders_with_profiles`, which joins the order with the courier profile.
 */

/** Number of orders shown per page. */
export const ORDERS_PAGE_SIZE = 20;

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

/**
 * Removes the characters that would break a PostgREST filter expression.
 *
 * The `*` and `%` wildcards are stripped on purpose: the search is already a
 * substring match, so a user-typed wildcard would only widen the result set
 * in surprising ways.
 */
function sanitizeSearchTerm(raw: string): string {
  return raw
    .replace(/[,()"\\*%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * `true` when the term can only be a fragment of a UUID.
 *
 * A fragment must be at least four hexadecimal characters and contain at
 * least one digit. This keeps ordinary names ("face", "beef") from being
 * mistaken for an order reference.
 */
function isUuidFragment(term: string): boolean {
  return (
    term.length >= 4 &&
    term.length <= 32 &&
    /^[0-9a-f]+$/.test(term) &&
    /[0-9]/.test(term)
  );
}

/** Formats a 32-character hex string back into the canonical UUID layout. */
function toUuid(hex: string): string {
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

/**
 * Builds the UUID range that covers every id starting with `prefix`.
 *
 * UUIDs sort lexicographically, so `[prefix + "0"…, prefix + "f"…)` is
 * exactly the set of ids that begin with the prefix.
 */
function uuidPrefixRange(prefix: string): { lo: string; hi: string } {
  const hex = prefix.toLowerCase();
  return {
    lo: toUuid(hex + "0".repeat(32 - hex.length)),
    hi: toUuid(hex + "f".repeat(32 - hex.length)),
  };
}

/**
 * Builds the PostgREST `or=(…)` expression for the free-text search.
 *
 * The order reference is matched with a UUID range (a `uuid` column has no
 * `ilike` operator) and the customer name with a case-insensitive `ilike` on
 * the `customer` JSON column.
 *
 * The returned string is the *inner* part of the expression — the Supabase
 * client wraps it in parentheses itself.
 */
export function buildOrderSearchFilter(term: string): string | null {
  const sanitized = sanitizeSearchTerm(term);
  if (!sanitized) return null;

  const branches: string[] = [];

  const fragment = sanitized.replace(/[#\s-]/g, "");
  if (isUuidFragment(fragment)) {
    const { lo, hi } = uuidPrefixRange(fragment);
    branches.push(`and(id.gte.${lo},id.lt.${hi})`);
  }

  branches.push(`customer->>full_name.ilike.*${sanitized}*`);

  return branches.join(",");
}

/** The `created_at` cut-off for the «الفترة» filter, or `null` for «الكل». */
export function orderPeriodCutoff(
  period: OrderPeriodFilter,
  now: Date = new Date(),
): Date | null {
  switch (period) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "all":
    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Orders                                   */
/* -------------------------------------------------------------------------- */

/**
 * Loads one page of orders, filtered and searched on the server.
 *
 * The search is a case-insensitive match on the order reference and the
 * customer name, pagination is a database-side `range()` and the total count
 * is exact.
 */
export async function fetchOrders(
  admin: SupabaseAdminClient,
  filters: OrderFilters,
): Promise<Paginated<OrderListRow>> {
  const page = Math.max(1, Math.floor(filters.page) || 1);
  const pageSize = Math.max(
    1,
    Math.min(50, Math.floor(filters.pageSize) || ORDERS_PAGE_SIZE),
  );

  let query = admin
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

  const { data, error, count } = await query.range(
    (page - 1) * pageSize,
    page * pageSize - 1,
  );

  if (error) throw error;

  const ids = (data ?? [])
    .map((row) => row.id)
    .filter((id): id is string => Boolean(id));

  const couriers = await fetchCourierNames(admin, ids);

  const rows: OrderListRow[] = (data ?? [])
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

  return {
    rows,
    count: count ?? rows.length,
    page,
    pageSize,
  };
}

/**
 * Maps the order ids of the current page to their courier name.
 *
 * `order_info` does not expose the courier, so `orders_with_profiles` is
 * queried for the ids of the page only.
 */
async function fetchCourierNames(
  admin: SupabaseAdminClient,
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;

  const { data, error } = await admin
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

/* -------------------------------------------------------------------------- */
/*                                   Stats                                    */
/* -------------------------------------------------------------------------- */

/**
 * Counts the orders shown in the KPI row.
 *
 * Every counter is a database-side `head` count, so the numbers are exact and
 * no rows travel over the wire.
 */
export async function fetchOrderStats(
  admin: SupabaseAdminClient,
): Promise<OrderStats> {
  const cutoff = orderPeriodCutoff("today");
  const todayStart = (cutoff ?? new Date()).toISOString();

  const [today, preparing, outForDelivery, deliveredToday] = await Promise.all([
    admin
      .from("order_info")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart),
    admin
      .from("order_info")
      .select("id", { count: "exact", head: true })
      .eq("status", "preparing"),
    admin
      .from("order_info")
      .select("id", { count: "exact", head: true })
      .eq("status", "out_for_delivery"),
    admin
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

  return {
    today: today.count ?? 0,
    preparing: preparing.count ?? 0,
    outForDelivery: outForDelivery.count ?? 0,
    deliveredToday: deliveredToday.count ?? 0,
  };
}

/* -------------------------------------------------------------------------- */
/*                                   Detail                                   */
/* -------------------------------------------------------------------------- */

/**
 * Loads everything the detail page shows for a single order.
 *
 * Returns `null` when the order does not exist, so the page can call
 * `notFound()`.
 */
export async function fetchOrderDetail(
  admin: SupabaseAdminClient,
  id: string,
): Promise<OrderDetail | null> {
  const { data: order, error: orderError } = await admin
    .from("order_info")
    .select(
      "id, total_price, status, delivery_address, created_at, customer, items",
    )
    .eq("id", id)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order?.id) return null;

  const [items, courier] = await Promise.all([
    fetchOrderItems(admin, order.id),
    fetchOrderCourier(admin, order.id),
  ]);

  const totalPrice = order.total_price ?? 0;
  const subtotal = items.reduce(
    (sum, item) => sum + (item.unitPrice ?? 0) * (item.quantity || 0),
    0,
  );

  return {
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
  };
}

/**
 * Loads the item lines of an order.
 *
 * `order_items.price` is the unit-price snapshot taken when the order was
 * placed, while `menu_items.price` is the current menu price — both are kept
 * so the UI can tell the admin that a price changed since the order.
 */
async function fetchOrderItems(
  admin: SupabaseAdminClient,
  orderId: string,
): Promise<OrderItemInfo[]> {
  const { data, error } = await admin
    .from("order_items")
    .select("id, quantity, price, menu_item:menu_items(id, name, price, image_url)")
    .eq("order_id", orderId);

  if (error) throw error;

  const items: OrderItemInfo[] = [];

  for (const row of data ?? []) {
    const menuItem = Array.isArray(row.menu_item)
      ? row.menu_item[0]
      : row.menu_item;

    items.push({
      id: row.id,
      quantity: row.quantity ?? 0,
      unitPrice: row.price,
      name: menuItem?.name ?? null,
      menuItemId: menuItem?.id ?? null,
      imageUrl: menuItem?.image_url ?? null,
      currentPrice: menuItem?.price ?? null,
    });
  }

  return items;
}

/**
 * Loads the courier assigned to an order.
 *
 * The courier is resolved through `orders_with_profiles.delivery_id` and the
 * matching `profiles` row, which carries the vehicle type and the rating.
 */
async function fetchOrderCourier(
  admin: SupabaseAdminClient,
  orderId: string,
): Promise<OrderCourier | null> {
  const { data: order, error: orderError } = await admin
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

  const { data: profile, error: profileError } = await admin
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

/* -------------------------------------------------------------------------- */
/*                                  Mutations                                 */
/* -------------------------------------------------------------------------- */

/**
 * Updates the status of an order.
 *
 * `orders.updated_at` is maintained by a database trigger, so only the
 * status is written here.
 */
export async function updateOrderStatus(
  admin: SupabaseAdminClient,
  id: string,
  status: string,
): Promise<void> {
  const { error } = await admin.from("orders").update({ status }).eq("id", id);

  if (error) throw error;
}
