import {
  ADMIN_ROLE_FILTERS,
  type AdminFilters,
  type AdminRoleFilter,
} from "@/features/admins/types";

/**
 * Berlin Food — Admins feature validation.
 *
 * The filter state is parsed from the raw URL search parameters; unknown or
 * malformed values fall back to the safe default («كل الأدوار»).
 */

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/** `true` when the given value is one of the known role filters. */
export function isAdminRoleFilter(value: unknown): value is AdminRoleFilter {
  return (
    typeof value === "string" &&
    (ADMIN_ROLE_FILTERS as readonly string[]).includes(value)
  );
}

/**
 * Normalises the raw URL search parameters of the page into the filter state
 * used by the data layer.
 */
export function parseAdminFilters(
  params: Record<string, string | string[] | undefined>,
  pageSize = 20,
): AdminFilters {
  const q = firstValue(params.q).trim().slice(0, 120);

  const roleRaw = firstValue(params.role);
  const role: AdminRoleFilter = isAdminRoleFilter(roleRaw) ? roleRaw : "all";

  const pageRaw = Number.parseInt(firstValue(params.page), 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return { q, role, page, pageSize };
}
