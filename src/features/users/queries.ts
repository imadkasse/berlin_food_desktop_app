import "server-only";

import { assertPermission } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  USERS_PAGE_SIZE,
  fetchUserById,
  fetchUserCounts,
  fetchUsers,
} from "@/services/users";
import type { UserCounts, UserFilters } from "@/features/users/types";
import { isUserId } from "@/features/users/validation";
import type { Paginated, ProfileRow } from "@/types/app";

/**
 * Permission-aware façade over the users data layer.
 *
 * Every function asserts `users.read` before touching the database, so a
 * caller can never read the user list without an authorised session.
 *
 * The queries themselves run with the service-role client: the dashboard needs
 * the complete list of accounts (including the e-mail), which the
 * `authenticated` role is not allowed to see for every row.
 */

/** Loads one page of users. */
export async function listUsers(
  filters: UserFilters,
): Promise<Paginated<ProfileRow>> {
  await assertPermission("users.read");

  const admin = createAdminClient();
  return fetchUsers(admin, {
    ...filters,
    pageSize: filters.pageSize || USERS_PAGE_SIZE,
  });
}

/** Loads the tab counters of the page. */
export async function loadUserCounts(): Promise<UserCounts> {
  await assertPermission("users.read");

  const admin = createAdminClient();
  return fetchUserCounts(admin);
}

/**
 * Loads a single user by id — `null` when the profile does not exist.
 *
 * A malformed id is rejected before the query: Postgres answers an invalid
 * uuid with a hard error, and an unknown link must render the not-found
 * state instead of crashing the page.
 */
export async function loadUserById(
  id: string,
): Promise<ProfileRow | null> {
  await assertPermission("users.read");

  if (!isUserId(id)) return null;

  const admin = createAdminClient();
  return fetchUserById(admin, id.trim());
}
