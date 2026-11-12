import {
  PERMISSIONS,
  PERMISSION_LABELS,
  type Permission,
  can,
  permissionsForRole,
  toRole,
} from "@/lib/auth/permissions";

/**
 * Berlin Food — capability descriptions derived from the permission matrix.
 *
 * Everything in this file is **derived** from `PERMISSIONS`
 * (`src/lib/auth/permissions.ts`): the Arabic sentence shown in the
 * «الصلاحيات» column is built from the permissions the role actually holds,
 * so the text can never drift away from the matrix.
 *
 * The module is pure — it is safe to use on the client.
 */

/** A domain of the dashboard and the permissions that unlock it. */
type CapabilityGroup = {
  /**
   * The Arabic noun of the domain in its genitive form — it always follows
   * «إدارة» / «عرض», which govern the genitive in Arabic.
   */
  phrase: string;
  /** The permission that grants full control over the domain. */
  manage: Permission;
  /** The permission that grants read-only access to the domain. */
  view: Permission;
};

/**
 * The domains of the dashboard, in the order they are rendered.
 *
 * The order is meaningful: it is the reading order of the «الصلاحيات»
 * column and the order of the Arabic sentence.
 */
const CAPABILITY_GROUPS: readonly CapabilityGroup[] = [
  { phrase: "المستخدمين", manage: "users.write", view: "users.read" },
  { phrase: "الطلبات", manage: "orders.write", view: "orders.read" },
  { phrase: "القائمة", manage: "menu.write", view: "menu.read" },
  { phrase: "التوصيل", manage: "deliveries.write", view: "deliveries.read" },
  { phrase: "المشرفين", manage: "admins.manage", view: "admins.manage" },
];

/**
 * The Arabic conjunction used to chain the domains.
 *
 * The «و» is a prefix: it is glued to the word that follows it, hence the
 * space **before** it and none after it.
 */
const CONJUNCTION = " و";

/** The text of a role that holds no dashboard permission at all. */
export const NO_DASHBOARD_PERMISSION_TEXT =
  "لا صلاحية داخل لوحة التحكم (دور محجوز)";

/**
 * Describes what a role may really do inside the dashboard.
 *
 * The three branches mirror the shape of the permission matrix:
 * - no permission at all → the role cannot act inside the dashboard;
 * - every permission of the matrix → full access;
 * - anything in between → the domains the role may manage or view.
 */
export function describeRoleCapabilities(
  role: string | null | undefined,
): string {
  const key = toRole(role);

  if (!key) return NO_DASHBOARD_PERMISSION_TEXT;

  const granted = permissionsForRole(key);
  const total = Object.keys(PERMISSIONS).length;

  if (granted.size === 0) return NO_DASHBOARD_PERMISSION_TEXT;

  if (granted.size === total) {
    const extras: string[] = [];

    if (can(key, "users.create.privileged")) extras.push("إنشاء المشرفين");
    if (can(key, "users.delete")) extras.push("حذف الحسابات");

    return extras.length > 0
      ? `كل الصلاحيات، بما فيها ${extras.join(CONJUNCTION)}`
      : "كل الصلاحيات";
  }

  const managed: string[] = [];
  const viewed: string[] = [];

  for (const group of CAPABILITY_GROUPS) {
    if (can(key, group.manage)) {
      managed.push(group.phrase);
    } else if (can(key, group.view)) {
      viewed.push(group.phrase);
    }
  }

  const parts: string[] = [];

  if (managed.length > 0) parts.push(`إدارة ${managed.join(CONJUNCTION)}`);
  if (viewed.length > 0) parts.push(`عرض ${viewed.join(CONJUNCTION)}`);

  if (parts.length === 0) return NO_DASHBOARD_PERMISSION_TEXT;

  return parts.join("، و");
}

/**
 * The full list of the Arabic permission labels granted to a role.
 *
 * Used as the tooltip of the «الصلاحيات» cell — the matrix stays the single
 * source of truth, the labels are read from `PERMISSION_LABELS`.
 */
export function describeRolePermissionLabels(
  role: string | null | undefined,
): string {
  const key = toRole(role);

  if (!key) return NO_DASHBOARD_PERMISSION_TEXT;

  const granted = [...permissionsForRole(key)];

  if (granted.length === 0) return NO_DASHBOARD_PERMISSION_TEXT;

  return granted.map((permission) => PERMISSION_LABELS[permission]).join("، ");
}
