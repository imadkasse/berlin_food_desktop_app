/**
 * Berlin Food — Shared Edge Function delivery helpers.
 *
 * Self-contained port of the courier-association logic from
 * `src/services/deliveries.ts`. Every function here expects a service-role
 * client: the caller of the Edge Function is responsible for the permission
 * assertions before invoking any of the mutations.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Profile } from "./types.ts";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/** Mirrors the `public.delivery_requests` row shape. */
export type DeliveryRequestRow = {
  id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
};

/** Which field of the request produced the courier match. */
export type CourierMatchSource = "email" | "phone";

export type CourierMatch = {
  /** The matched `profiles` row. */
  profile: Profile;
  /** How the association was derived. */
  source: CourierMatchSource;
  /** `true` when the matched profile already carries the `delivery` role. */
  isCourier: boolean;
};

export type DeliveryStatus = DeliveryRequestRow["status"];

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

/** Normalises a phone number to its digits only (used for fuzzy matching). */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Finds profiles whose e-mail equals `email` (case-insensitive).
 *
 * `public.profiles` exposes an `email` column, so the auth-user fallback of
 * the server-side service is not needed here.
 */
async function findProfilesByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<Profile[]> {
  const target = email.trim();
  if (!target) return [];

  const { data, error } = await admin
    .from("profiles")
    .select<string, Profile>("*")
    .ilike("email", target)
    .limit(5);

  if (error) {
    console.error("تعذّر البحث عن الحساب بالبريد الإلكتروني:", error.message);
    throw error;
  }

  return data ?? [];
}

/**
 * Finds profiles whose phone number equals `phone`.
 *
 * The exact match is tried first; when nothing is found the lookup falls back
 * to a digit-only comparison so that `067 541 6320` still finds `0675416320`.
 */
async function findProfilesByPhone(
  admin: SupabaseClient,
  phone: string,
): Promise<Profile[]> {
  const trimmed = phone.trim();
  if (!trimmed) return [];

  const { data, error } = await admin
    .from("profiles")
    .select<string, Profile>("*")
    .ilike("phone_number", trimmed)
    .limit(20);

  if (error) throw error;
  if (data && data.length > 0) return data;

  const digits = digitsOnly(trimmed);
  if (digits.length < 4) return [];

  const { data: fuzzy, error: fuzzyError } = await admin
    .from("profiles")
    .select<string, Profile>("*")
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
 * A matched profile whose role is `delivery` is the courier account. A matched
 * profile with another role is returned as well (the admin can then promote
 * it), but it is flagged with `isCourier: false`.
 *
 * Returns `null` when nothing matches — no association is ever invented.
 */
export async function resolveCourierMatch(
  admin: SupabaseClient,
  request: DeliveryRequestRow,
): Promise<CourierMatch | null> {
  const candidates: CourierMatch[] = [];
  const seen = new Set<string>();

  const push = (profile: Profile, source: CourierMatchSource) => {
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

/** Loads a single delivery request, or `null` when it does not exist. */
export async function fetchDeliveryRequestById(
  admin: SupabaseClient,
  id: string,
): Promise<DeliveryRequestRow | null> {
  const { data, error } = await admin
    .from("delivery_requests")
    .select<string, DeliveryRequestRow>("*")
    .eq("id", id)
    .limit(1);

  if (error) throw error;
  return data?.[0] ?? null;
}

/** Updates the status of a delivery request. */
export async function updateDeliveryRequestStatus(
  admin: SupabaseClient,
  id: string,
  status: DeliveryStatus,
): Promise<void> {
  const { error } = await admin
    .from("delivery_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

/**
 * Changes the role of a profile.
 *
 * MUST be executed with the service-role client: the `authenticated` role has
 * no column-level grant on `public.profiles.role`.
 */
export async function setProfileRole(
  admin: SupabaseClient,
  profileId: string,
  role: string,
): Promise<void> {
  const { error } = await admin
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", profileId);

  if (error) throw error;
}
