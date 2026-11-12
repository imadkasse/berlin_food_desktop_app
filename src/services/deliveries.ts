import "server-only";

import type { SupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  DeliveryRequestRow,
  DeliveryRequestStatus,
  OrderRow,
  Paginated,
  ProfileRow,
} from "@/types/app";
import type {
  CourierMatch,
  DeliveryPeriodFilter,
  DeliveryRequestFilters,
  DeliveryStats,
} from "@/features/deliveries/types";

/**
 * Data-access layer for the delivery-requests feature.
 *
 * Everything here runs with the service-role client, so the callers are
 * responsible for the permission assertions (see `src/features/deliveries/queries.ts`).
 */

export const DELIVERY_PAGE_SIZE = 10;

/** Maximum number of delivery-history rows loaded for the detail panel. */
export const DELIVERY_HISTORY_LIMIT = 50;

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

/**
 * Removes the characters that would break a PostgREST `or=(...)` filter
 * expression. The wildcards `%` and `_` are kept on purpose — they are valid
 * `ilike` wildcards and simply widen the search.
 */
function sanitizeSearchTerm(raw: string): string {
  return raw
    .replace(/[,()"\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalises a phone number to its digits only (used for fuzzy matching). */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** The `created_at` cut-off for the «الفترة» filter, or `null` for «الكل». */
export function deliveryPeriodCutoff(
  period: DeliveryPeriodFilter,
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
/*                              Profiles: capability                          */
/* -------------------------------------------------------------------------- */

type ProfileEmailSupport = "unknown" | "available" | "missing";

let profileEmailSupport: ProfileEmailSupport = "unknown";

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  if (error.code === "42703") return true;
  return /does not exist|column .* not found|unknown column/i.test(
    error.message ?? "",
  );
}

/**
 * Detects whether `public.profiles` exposes an `email` column.
 *
 * Some deployments only keep the e-mail inside `auth.users`; in that case the
 * association is derived from the auth record instead. The probe is cached
 * per server process because the schema does not change at runtime.
 */
async function profilesExposeEmail(admin: SupabaseAdminClient): Promise<boolean> {
  if (profileEmailSupport === "available") return true;
  if (profileEmailSupport === "missing") return false;

  const { error } = await admin.from("profiles").select("email").limit(1);

  if (!error) {
    profileEmailSupport = "available";
    return true;
  }

  if (isMissingColumnError(error)) {
    profileEmailSupport = "missing";
    return false;
  }

  // Unknown failure — assume the column exists and let the real query fail.
  return true;
}

/* -------------------------------------------------------------------------- */
/*                             Profiles: matching                             */
/* -------------------------------------------------------------------------- */

/**
 * Finds profiles whose e-mail equals `email` (case-insensitive).
 *
 * Uses `public.profiles.email` when the column exists, otherwise falls back
 * to the matching `auth.users` record (the auth id is the profile id).
 */
async function findProfilesByEmail(
  admin: SupabaseAdminClient,
  email: string,
): Promise<ProfileRow[]> {
  const target = email.trim();
  if (!target) return [];

  if (await profilesExposeEmail(admin)) {
    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .ilike("email", target)
      .limit(5);

    if (!error) return data ?? [];
    if (!isMissingColumnError(error)) throw error;

    // The column vanished between the probe and the query.
    profileEmailSupport = "missing";
  }

  return findProfilesByAuthEmail(admin, target);
}

/** Fallback: resolve the account through its `auth.users` e-mail. */
async function findProfilesByAuthEmail(
  admin: SupabaseAdminClient,
  email: string,
): Promise<ProfileRow[]> {
  const target = email.trim().toLowerCase();

  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      console.error("تعذّر قراءة حسابات المصادقة:", error.message);
      return [];
    }

    const user = data.users.find(
      (candidate) => (candidate.email ?? "").toLowerCase() === target,
    );

    if (user) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .limit(1);

      return profiles ?? [];
    }

    if (data.users.length < 1000) break;
  }

  return [];
}

/**
 * Finds profiles whose phone number equals `phone`.
 *
 * The exact match is tried first; when nothing is found the lookup falls back
 * to a digit-only comparison so that `067 541 6320` still finds `0675416320`.
 */
async function findProfilesByPhone(
  admin: SupabaseAdminClient,
  phone: string,
): Promise<ProfileRow[]> {
  const trimmed = phone.trim();
  if (!trimmed) return [];

  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .ilike("phone_number", trimmed)
    .limit(20);

  if (error) throw error;
  if (data && data.length > 0) return data;

  const digits = digitsOnly(trimmed);
  if (digits.length < 4) return [];

  const { data: fuzzy, error: fuzzyError } = await admin
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
 *   1. match on e-mail (exact, case-insensitive) — `auth.users` is used as a
 *      fallback when `profiles.email` does not exist;
 *   2. match on phone number.
 *
 * A matched profile whose role is `delivery` is the courier account. A matched
 * profile with another role is returned as well (the admin can then promote
 * it), but it is flagged with `isCourier: false`.
 *
 * Returns `null` when nothing matches — no association is ever invented.
 */
export async function resolveCourierMatch(
  admin: SupabaseAdminClient,
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
    for (const profile of await findProfilesByEmail(admin, email)) {
      push(profile, "email");
    }
  }

  const phone = request.phone_number?.trim();
  if (phone) {
    for (const profile of await findProfilesByPhone(admin, phone)) {
      push(profile, "phone");
    }
  }

  if (candidates.length === 0) return null;

  return [...candidates].sort(compareMatches)[0];
}

/* -------------------------------------------------------------------------- */
/*                             Delivery requests                              */
/* -------------------------------------------------------------------------- */

/**
 * Loads one page of delivery requests, filtered and searched on the server.
 *
 * The search is a case-insensitive `ilike` over the name, the e-mail and the
 * phone number; pagination is a database-side `range()`.
 */
export async function fetchDeliveryRequests(
  admin: SupabaseAdminClient,
  filters: DeliveryRequestFilters,
): Promise<Paginated<DeliveryRequestRow>> {
  const page = Math.max(1, Math.floor(filters.page) || 1);
  const pageSize = Math.max(1, Math.min(50, Math.floor(filters.pageSize) || DELIVERY_PAGE_SIZE));

  let query = admin
    .from("delivery_requests")
    .select("*", { count: "exact" });

  const term = sanitizeSearchTerm(filters.q ?? "");
  if (term) {
    query = query.or(
      `full_name.ilike.%${term}%,email.ilike.%${term}%,phone_number.ilike.%${term}%`,
    );
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const cutoff = deliveryPeriodCutoff(filters.period);
  if (cutoff) {
    query = query.gte("created_at", cutoff.toISOString());
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) throw error;

  const total = count ?? data?.length ?? 0;

  return {
    rows: data ?? [],
    count: total,
    page,
    pageSize,
  };
}

/** Counts the delivery requests per status (always over the whole table). */
export async function fetchDeliveryStats(
  admin: SupabaseAdminClient,
): Promise<DeliveryStats> {
  const { data, error } = await admin
    .from("delivery_requests")
    .select("status");

  if (error) throw error;

  const stats: DeliveryStats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  };

  for (const row of data ?? []) {
    stats.total += 1;
    if (row.status === "pending") stats.pending += 1;
    else if (row.status === "approved") stats.approved += 1;
    else if (row.status === "rejected") stats.rejected += 1;
  }

  return stats;
}

/** Loads a single delivery request. */
export async function fetchDeliveryRequestById(
  admin: SupabaseAdminClient,
  id: string,
): Promise<DeliveryRequestRow | null> {
  const { data, error } = await admin
    .from("delivery_requests")
    .select("*")
    .eq("id", id)
    .limit(1);

  if (error) throw error;
  return data?.[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/*                                Delivery history                             */
/* -------------------------------------------------------------------------- */

/**
 * Loads the orders that were assigned to a courier, newest first.
 *
 * This is the «سجل التوصيل» of the detail panel.
 */
export async function fetchCourierOrders(
  admin: SupabaseAdminClient,
  courierId: string,
): Promise<{ rows: OrderRow[]; total: number }> {
  const { data, error, count } = await admin
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
/*                                  Mutations                                 */
/* -------------------------------------------------------------------------- */

/** Updates the status of a delivery request. */
export async function updateDeliveryRequestStatus(
  admin: SupabaseAdminClient,
  id: string,
  status: DeliveryRequestStatus,
): Promise<void> {
  const { error } = await admin
    .from("delivery_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

/** Deletes a delivery request permanently. */
export async function deleteDeliveryRequest(
  admin: SupabaseAdminClient,
  id: string,
): Promise<void> {
  const { error } = await admin.from("delivery_requests").delete().eq("id", id);
  if (error) throw error;
}

/** Inserts a new delivery request. It always starts as `pending`. */
export async function insertDeliveryRequest(
  admin: SupabaseAdminClient,
  input: { fullName: string; phoneNumber: string; email: string | null },
): Promise<DeliveryRequestRow> {
  const { data, error } = await admin
    .from("delivery_requests")
    .insert({
      full_name: input.fullName,
      phone_number: input.phoneNumber,
      email: input.email,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

/**
 * Changes the role of a profile.
 *
 * MUST be executed with the service-role client: the `authenticated` role has
 * no column-level grant on `public.profiles.role`, so a session-bound client
 * would silently fail (or be blocked by RLS) on this update.
 */
export async function setProfileRole(
  admin: SupabaseAdminClient,
  profileId: string,
  role: string,
): Promise<void> {
  const { error } = await admin
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", profileId);

  if (error) throw error;
}
