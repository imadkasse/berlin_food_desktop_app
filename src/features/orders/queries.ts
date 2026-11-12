import "server-only";

import { assertPermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ORDERS_PAGE_SIZE,
  fetchOrderDetail,
  fetchOrderStats,
  fetchOrders,
} from "@/services/orders";
import type {
  OrderDetail,
  OrderFilters,
  OrderListRow,
  OrderStats,
} from "@/features/orders/types";
import type { Paginated } from "@/types/app";

/**
 * Permission-aware façade over the orders data layer.
 *
 * Every function asserts `orders.read` before touching the database, so a
 * caller can never read order data without an authorised session.
 */

/** Loads one page of orders. */
export async function listOrders(
  filters: OrderFilters,
): Promise<Paginated<OrderListRow>> {
  await assertPermission("orders.read");

  const admin = createAdminClient();
  return fetchOrders(admin, {
    ...filters,
    pageSize: filters.pageSize || ORDERS_PAGE_SIZE,
  });
}

/** Loads the KPI counters of the page. */
export async function loadOrderStats(): Promise<OrderStats> {
  await assertPermission("orders.read");

  const admin = createAdminClient();
  return fetchOrderStats(admin);
}

/**
 * Loads the detail of a single order.
 *
 * Returns `null` when the order does not exist, so the page can call
 * `notFound()`.
 */
export async function loadOrderDetail(
  id: string,
): Promise<OrderDetail | null> {
  await assertPermission("orders.read");

  const admin = createAdminClient();
  return fetchOrderDetail(admin, id);
}
