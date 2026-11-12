import type { ProfileRow } from "@/types/app";

/**
 * Berlin Food — Users feature types.
 *
 * The shapes in this file are the serialisable contract between the server
 * pages (`src/app/dashboard/users/**`) and the client components in
 * `src/features/users/components`. Only plain data crosses the boundary.
 */

/* -------------------------------------------------------------------------- */
/*                                    Tabs                                     */
/* -------------------------------------------------------------------------- */

/** The four tabs of the users page. */
export type UserTab = "all" | "customers" | "delivery" | "admins";

export const USER_TABS: readonly UserTab[] = [
  "all",
  "customers",
  "delivery",
  "admins",
];

/** Arabic label of every tab. */
export const USER_TAB_LABELS: Record<UserTab, string> = {
  all: "الكل",
  customers: "العملاء",
  delivery: "مندوبو التوصيل",
  admins: "المشرفون",
};

/* -------------------------------------------------------------------------- */
/*                                   Filters                                   */
/* -------------------------------------------------------------------------- */

/** Value of the «الحالة» filter. */
export type UserStatusFilter = "all" | "active" | "unavailable";

/** Value of the «ترتيب» filter. */
export type UserSort = "updated_desc" | "name_asc" | "role_asc";

/** The normalised filter state of the users page. */
export type UserFilters = {
  /** Free-text search over the name, the e-mail and the phone number. */
  q: string;
  tab: UserTab;
  status: UserStatusFilter;
  sort: UserSort;
  page: number;
  pageSize: number;
};

/** Arabic labels of the «الحالة» filter options. */
export const USER_STATUS_LABELS: Record<UserStatusFilter, string> = {
  all: "الكل",
  active: "نشط",
  unavailable: "غير متاح",
};

/** Arabic labels of the «ترتيب» filter options. */
export const USER_SORT_LABELS: Record<UserSort, string> = {
  updated_desc: "الأحدث تحديثًا",
  name_asc: "الاسم",
  role_asc: "الدور",
};

/* -------------------------------------------------------------------------- */
/*                                    Data                                     */
/* -------------------------------------------------------------------------- */

/** A single row of the users table — a `profiles` row. */
export type UserRow = ProfileRow;

/** The number of users behind every tab. */
export type UserCounts = {
  all: number;
  customers: number;
  delivery: number;
  admins: number;
};

/** The permissions a role grants, resolved for the detail page. */
export type GrantedPermission = {
  /** The permission identifier, e.g. `users.write`. */
  key: string;
  /** Its Arabic label, e.g. «تعديل المستخدمين». */
  label: string;
};

/* -------------------------------------------------------------------------- */
/*                              Server action results                          */
/* -------------------------------------------------------------------------- */

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };
