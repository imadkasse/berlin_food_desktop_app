import "server-only";

import { assertPermission } from "@/lib/auth/guard";
import { PRIVILEGED_ROLES } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { USERS_PAGE_SIZE, sanitizeSearchTerm } from "@/services/users";
import type { AdminCounts, AdminFilters } from "@/features/admins/types";
import type { Paginated, ProfileRow } from "@/types/app";

/**
 * Permission-aware façade over the administrators data.
 *
 * Every function asserts `admins.manage` **before** touching the database, so
 * the accounts of the administrative tier can never be read — nor written —
 * by an account without the permission.
 *
 * The queries themselves run with the service-role client: the dashboard
 * needs the complete list of accounts (including the e-mail), which the
 * `authenticated` role is not allowed to see for every row.
 */

/** Loads one page of the privileged accounts (admins, managers, support, superadmins). */
export async function listPrivilegedAccounts(
  filters: AdminFilters,
): Promise<Paginated<ProfileRow>> {
  await assertPermission("admins.manage");

  const admin = createAdminClient();

  const page = Math.max(1, Math.floor(filters.page) || 1);
  const pageSize = Math.max(
    1,
    Math.min(50, Math.floor(filters.pageSize) || USERS_PAGE_SIZE),
  );

  // Without a role filter the table shows the whole administrative tier.
  const roles: string[] =
    filters.role && filters.role !== "all"
      ? [filters.role]
      : [...PRIVILEGED_ROLES];

  let query = admin
    .from("profiles")
    .select("*", { count: "exact" })
    .in("role", roles);

  const term = sanitizeSearchTerm(filters.q ?? "");
  if (term) {
    query = query.or(
      `full_name.ilike.%${term}%,email.ilike.%${term}%,phone_number.ilike.%${term}%`,
    );
  }

  query = query.order("updated_at", {
    ascending: false,
    nullsFirst: false,
  });

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
 * Counts the accounts behind every privileged role.
 *
 * The counters describe the whole administrative tier (they are not narrowed
 * down by the current search), so the admin always sees the size of each
 * segment.
 */
export async function loadAdminCounts(): Promise<AdminCounts> {
  await assertPermission("admins.manage");

  const admin = createAdminClient();

  const results = await Promise.all(
    PRIVILEGED_ROLES.map((role) =>
      admin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", role),
    ),
  );

  for (const result of results) {
    if (result.error) throw result.error;
  }

  const counts = {
    admin: 0,
    manager: 0,
    support: 0,
    superadmin: 0,
  };

  PRIVILEGED_ROLES.forEach((role, index) => {
    counts[role] = results[index].count ?? 0;
  });

  const total = PRIVILEGED_ROLES.reduce(
    (sum, role) => sum + counts[role],
    0,
  );

  return { ...counts, total };
}
