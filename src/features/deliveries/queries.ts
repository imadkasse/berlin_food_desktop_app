import "server-only";

import { assertPermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DELIVERY_PAGE_SIZE,
  fetchCourierOrders,
  fetchDeliveryRequestById,
  fetchDeliveryRequests,
  fetchDeliveryStats,
  resolveCourierMatch,
} from "@/services/deliveries";
import type {
  DeliveryRequestDetail,
  DeliveryRequestFilters,
  DeliveryStats,
} from "@/features/deliveries/types";
import type {
  DeliveryRequestRow,
  OrderRow,
  Paginated,
} from "@/types/app";

/**
 * Permission-aware façade over the delivery-requests data layer.
 *
 * Every function asserts `deliveries.read` before touching the database, so a
 * caller can never read delivery data without an authorised session.
 */

/** Loads one page of delivery requests. */
export async function listDeliveryRequests(
  filters: DeliveryRequestFilters,
): Promise<Paginated<DeliveryRequestRow>> {
  await assertPermission("deliveries.read");

  const admin = createAdminClient();
  return fetchDeliveryRequests(admin, {
    ...filters,
    pageSize: filters.pageSize || DELIVERY_PAGE_SIZE,
  });
}

/** Loads the KPI counters of the page. */
export async function loadDeliveryStats(): Promise<DeliveryStats> {
  await assertPermission("deliveries.read");

  const admin = createAdminClient();
  return fetchDeliveryStats(admin);
}

/**
 * Loads everything the detail panel shows: the request itself, the derived
 * courier association and the courier's delivery history.
 */
export async function loadDeliveryRequestDetail(
  id: string,
): Promise<DeliveryRequestDetail | null> {
  await assertPermission("deliveries.read");

  const admin = createAdminClient();
  const request = await fetchDeliveryRequestById(admin, id);
  if (!request) return null;

  const match = await resolveCourierMatch(admin, request);

  let history: OrderRow[] = [];
  let historyTotal = 0;

  if (match?.isCourier) {
    const orders = await fetchCourierOrders(admin, match.profile.id);
    history = orders.rows;
    historyTotal = orders.total;
  }

  return { request, match, history, historyTotal };
}
