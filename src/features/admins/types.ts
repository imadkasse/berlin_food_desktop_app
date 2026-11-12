import {
  PRIVILEGED_ROLES,
  ROLE_LABELS,
  type Role,
} from "@/lib/auth/permissions";

/**
 * Berlin Food — Admins feature types.
 *
 * The shapes in this file are the serialisable contract between the server
 * page (`src/app/dashboard/admins/page.tsx`) and the client components in
 * `src/features/admins/components`. Only plain data crosses the boundary.
 */

/** The privileged roles — the accounts managed by this area. */
export type PrivilegedRole = (typeof PRIVILEGED_ROLES)[number];

/** The value of the «الدور» filter of the admins table. */
export type AdminRoleFilter = Role | "all";

/** The role filters offered by the table — the privileged roles plus «الكل». */
export const ADMIN_ROLE_FILTERS: readonly AdminRoleFilter[] = [
  "all",
  "superadmin",
  "admin",
  "manager",
  "support",
];

/** Arabic labels of the «الدور» filter. */
export const ADMIN_ROLE_FILTER_LABELS: Record<AdminRoleFilter, string> = {
  all: "كل الأدوار",
  ...ROLE_LABELS,
};

/** The normalised filter state of the admins page. */
export type AdminFilters = {
  /** Free-text search over the name, the e-mail and the phone number. */
  q: string;
  /** The privileged role the table is narrowed down to. */
  role: AdminRoleFilter;
  page: number;
  pageSize: number;
};

/** The number of accounts behind every privileged role. */
export type AdminCounts = {
  total: number;
  superadmin: number;
  admin: number;
  manager: number;
  support: number;
};
