import "server-only";

import type { SupabaseAdminClient } from "@/lib/supabase/admin";
import type { Paginated, ProfileRow } from "@/types/app";
import type { UserCounts, UserFilters, UserTab } from "@/features/users/types";

/**
 * Berlin Food — Users data-access layer (server only).
 *
 * Every function here runs with the **service-role** client, therefore the
 * callers are responsible for the permission assertions
 * (see `src/features/users/queries.ts` and `src/features/users/actions.ts`).
 *
 * The `profiles` table has no column-level grant for the `authenticated` role
 * on `profiles.role`, so every role change MUST go through this service.
 */

/** Number of rows shown on one page of the users table. */
export const USERS_PAGE_SIZE = 20;

/** Roles that the «المشرفون» tab groups together. */
const PRIVILEGED_ROLES = ["admin", "manager", "support", "superadmin"] as const;

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

/**
 * Removes the characters that would break a PostgREST `or=(...)` filter
 * expression (a comma, a parenthesis, a quote or a backslash).
 *
 * The `%` and `_` wildcards are kept on purpose — they are valid `ilike`
 * wildcards and simply widen the search.
 */
export function sanitizeSearchTerm(raw: string): string {
  return raw
    .replace(/[,()"\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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
/*                                    Reads                                   */
/* -------------------------------------------------------------------------- */

/**
 * Loads one page of users, searched and filtered on the server.
 *
 * The search is a case-insensitive `ilike` over the name, the e-mail and the
 * phone number; the pagination is a database-side `range()`.
 */
export async function fetchUsers(
  admin: SupabaseAdminClient,
  filters: UserFilters,
): Promise<Paginated<ProfileRow>> {
  const page = Math.max(1, Math.floor(filters.page) || 1);
  const pageSize = Math.max(
    1,
    Math.min(50, Math.floor(filters.pageSize) || USERS_PAGE_SIZE),
  );

  let query = admin.from("profiles").select("*", { count: "exact" });

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

  const { data, error, count } = await query.range(
    (page - 1) * pageSize,
    page * pageSize - 1,
  );

  if (error) throw error;

  return {
    rows: data ?? [],
    count: count ?? data?.length ?? 0,
    page,
    pageSize,
  };
}

/**
 * Counts the users behind every tab.
 *
 * The counters describe the whole table (they are not narrowed down by the
 * current search), so the admin always sees the size of each segment.
 */
export async function fetchUserCounts(
  admin: SupabaseAdminClient,
): Promise<UserCounts> {
  const [all, customers, delivery, admins] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "customer"),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "delivery"),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("role", [...PRIVILEGED_ROLES]),
  ]);

  for (const result of [all, customers, delivery, admins]) {
    if (result.error) throw result.error;
  }

  return {
    all: all.count ?? 0,
    customers: customers.count ?? 0,
    delivery: delivery.count ?? 0,
    admins: admins.count ?? 0,
  };
}

/** Loads a single profile by its id. */
export async function fetchUserById(
  admin: SupabaseAdminClient,
  id: string,
): Promise<ProfileRow | null> {
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/**
 * Reads the **auth** e-mail of a user — the login identity.
 *
 * `profiles.email` mirrors it (through the `sync_profile_email` trigger), but
 * the auth row is the source of truth, so it is the one that has to be read
 * when the two may have drifted apart.
 */
export async function fetchUserAuthEmail(
  admin: SupabaseAdminClient,
  id: string,
): Promise<string | null> {
  const { data, error } = await admin.auth.admin.getUserById(id);

  if (error) throw error;
  return data.user?.email ?? null;
}

/* -------------------------------------------------------------------------- */
/*                                   Writes                                   */
/* -------------------------------------------------------------------------- */

/**
 * Creates a platform account.
 *
 * The `profiles` row is created automatically by the database trigger that
 * mirrors `auth.users` — the explicit update afterwards guarantees that the
 * role is **exactly** the requested one and that the e-mail is mirrored.
 *
 * MUST be executed with the service-role client.
 */
export async function createUserAccount(
  admin: SupabaseAdminClient,
  input: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    role: string;
    vehicleType: string | null;
    availabilityStatus: boolean | null;
    address: unknown;
  },
): Promise<{ id: string }> {
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
      phone_number: input.phoneNumber,
      role: input.role,
      vehicle_type: input.vehicleType,
      availability_status: input.availabilityStatus,
      address: input.address,
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error("تعذّر إنشاء الحساب: بيانات المستخدم غير مكتملة.");

  const userId = data.user.id;

  // The trigger already created the row; this update makes the role and the
  // e-mail explicit instead of relying on the trigger's defaults.
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      full_name: input.fullName,
      phone_number: input.phoneNumber,
      email: input.email,
      role: input.role,
      vehicle_type: input.vehicleType,
      availability_status: input.availabilityStatus,
      address: (input.address ?? null) as never,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) throw updateError;

  return { id: userId };
}

/**
 * Updates the editable profile fields of a user.
 *
 * The `role` column is deliberately **not** part of the payload: a role change
 * is a separate, more privileged operation
 * (see `src/features/users/actions.ts` → `updateUserRoleAction`).
 */
export async function updateUserProfile(
  admin: SupabaseAdminClient,
  id: string,
  input: {
    fullName: string;
    phoneNumber: string;
    email: string;
    vehicleType: string | null;
    availabilityStatus: boolean | null;
    address: unknown;
  },
): Promise<void> {
  const { error } = await admin
    .from("profiles")
    .update({
      full_name: input.fullName,
      phone_number: input.phoneNumber,
      email: input.email,
      vehicle_type: input.vehicleType,
      availability_status: input.availabilityStatus,
      address: (input.address ?? null) as never,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

/**
 * Updates the e-mail of the **auth** user.
 *
 * `profiles.email` is written separately (see `updateUserProfile`), but the
 * auth row is the login identity — updating only the profile would let the
 * two e-mail columns drift apart, and `profiles.email` is the key the courier
 * matching relies on.
 *
 * `email_confirm` is set because the accounts are created pre-confirmed: a
 * plain e-mail change would otherwise leave the account unconfirmed and
 * therefore unable to sign in.
 *
 * MUST be executed with the service-role client.
 */
export async function updateUserAuthEmail(
  admin: SupabaseAdminClient,
  id: string,
  email: string,
): Promise<void> {
  const { error } = await admin.auth.admin.updateUserById(id, {
    email,
    email_confirm: true,
  });

  if (error) throw error;
}

/**
 * Changes the role of a user.
 *
 * MUST be executed with the service-role client: the `authenticated` role has
 * no column-level grant on `public.profiles.role`.
 */
export async function updateUserRole(
  admin: SupabaseAdminClient,
  id: string,
  role: string,
): Promise<void> {
  const { error } = await admin
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

/** Flips the availability flag of a user. */
export async function updateUserAvailability(
  admin: SupabaseAdminClient,
  id: string,
  availabilityStatus: boolean,
): Promise<void> {
  const { error } = await admin
    .from("profiles")
    .update({
      availability_status: availabilityStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

/**
 * Deletes a platform account.
 *
 * The `profiles` row is removed by the foreign key cascade, so deleting the
 * auth user is enough.
 */
export async function deleteUserAccount(
  admin: SupabaseAdminClient,
  id: string,
): Promise<void> {
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw error;
}
