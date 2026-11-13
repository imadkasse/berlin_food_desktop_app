/**
 * Berlin Food — Role Based Access Control (Edge Function copy).
 *
 * This is a self-contained replica of `src/lib/auth/permissions.ts`.
 * The authoritative enforcement happens inside the Edge Functions.
 */

import type { Permission, Role } from "./types.ts";

export const ROLES = [
  "customer",
  "delivery",
  "admin",
  "manager",
  "support",
  "superadmin",
] as const;

/** Roles that hold elevated platform access. */
export const PRIVILEGED_ROLES = ["admin", "manager", "support", "superadmin"] as const;

/** The canonical display order for role pickers and role lists. */
export const ROLE_ORDER: readonly Role[] = [
  "superadmin",
  "admin",
  "manager",
  "support",
  "delivery",
  "customer",
];

export const PERMISSIONS: Record<Permission, readonly Role[]> = {
  "users.read": ["admin", "superadmin"],
  "users.write": ["admin", "superadmin"],
  "users.delete": ["superadmin"],
  "users.create.customer": ["admin", "superadmin"],
  "users.create.delivery": ["admin", "superadmin"],
  "users.create.privileged": ["superadmin"],
  "orders.read": ["admin", "superadmin"],
  "orders.write": ["admin", "superadmin"],
  "orders.delete": ["superadmin"],
  "deliveries.read": ["admin", "superadmin"],
  "deliveries.write": ["admin", "superadmin"],
  "menu.read": ["admin", "superadmin"],
  "menu.write": ["admin", "superadmin"],
  "categories.write": ["admin", "superadmin"],
  "profile.read": ["admin", "superadmin"],
  "profile.write": ["admin", "superadmin"],
  "admins.manage": ["superadmin"],
  "roles.manage": ["superadmin"],
};

/** Arabic labels for each role. */
export const ROLE_LABELS: Record<Role, string> = {
  customer: "عميل",
  delivery: "مندوب توصيل",
  admin: "مشرف",
  manager: "مدير",
  support: "دعم",
  superadmin: "مدير أعلى",
};

/** One-line Arabic description for each role. */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  customer: "حساب عميل يطلب الطعام ويتابع طلباته.",
  delivery: "مندوب توصيل يستلم الطلبات ويوصلها.",
  admin: "يدير المستخدمين والطلبات والقائمة ويطّلع على الإحصاءات.",
  manager: "إدارة تشغيلية أوسع مع صلاحيات إدارية موسّعة.",
  support: "يدعم العملاء ويتابع الطلبات دون صلاحيات حساسة.",
  superadmin: "أعلى صلاحية: إنشاء المشرفين وإدارة الأدوار والحسابات.",
};

/** Arabic labels for each permission. */
export const PERMISSION_LABELS: Record<Permission, string> = {
  "users.read": "عرض المستخدمين",
  "users.write": "تعديل المستخدمين",
  "users.delete": "حذف المستخدمين",
  "users.create.customer": "إنشاء حسابات عملاء",
  "users.create.delivery": "إنشاء حسابات مندوبي توصيل",
  "users.create.privileged": "إنشاء حسابات إدارية",
  "orders.read": "عرض الطلبات",
  "orders.write": "تعديل الطلبات",
  "orders.delete": "حذف الطلبات",
  "deliveries.read": "عرض طلبات التوصيل",
  "deliveries.write": "تعديل طلبات التوصيل",
  "menu.read": "عرض القائمة",
  "menu.write": "تعديل القائمة",
  "categories.write": "تعديل التصنيفات",
  "profile.read": "عرض الملف الشخصي",
  "profile.write": "تعديل الملف الشخصي",
  "admins.manage": "إدارة المشرفين",
  "roles.manage": "إدارة الأدوار",
};

/**
 * Arabic message shown when a permission is missing.
 * The message is intentionally actionable and never leaks technical details.
 */
export const PERMISSION_DENIAL_MESSAGES: Record<Permission, string> = {
  "users.read": "لا تملك صلاحية عرض المستخدمين.",
  "users.write": "لا تملك صلاحية تعديل المستخدمين.",
  "users.delete": "هذا الإجراء متاح للمدير الأعلى فقط.",
  "users.create.customer": "لا تملك صلاحية إنشاء حسابات العملاء.",
  "users.create.delivery": "لا تملك صلاحية إنشاء حسابات مندوبي التوصيل.",
  "users.create.privileged": "هذا الإجراء متاح للمدير الأعلى فقط.",
  "orders.read": "لا تملك صلاحية عرض الطلبات.",
  "orders.write": "لا تملك صلاحية تعديل الطلبات.",
  "orders.delete": "هذا الإجراء متاح للمدير الأعلى فقط.",
  "deliveries.read": "لا تملك صلاحية عرض طلبات التوصيل.",
  "deliveries.write": "لا تملك صلاحية تعديل طلبات التوصيل.",
  "menu.read": "لا تملك صلاحية عرض القائمة.",
  "menu.write": "لا تملك صلاحية تعديل القائمة.",
  "categories.write": "لا تملك صلاحية تعديل التصنيفات.",
  "profile.read": "لا تملك صلاحية عرض الملف الشخصي.",
  "profile.write": "لا تملك صلاحية تعديل الملف الشخصي.",
  "admins.manage": "هذا الإجراء متاح للمدير الأعلى فقط.",
  "roles.manage": "هذا الإجراء متاح للمدير الأعلى فقط.",
};

/** Returns true when the given role holds the given permission. */
export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(role);
}

/** Returns true when the role is one of admin / manager / support / superadmin. */
export function isPrivilegedRole(role: Role | null | undefined): boolean {
  if (!role) return false;
  return (PRIVILEGED_ROLES as readonly Role[]).includes(role);
}

/**
 * Returns true when `actorRole` is allowed to create / assign `targetRole`.
 *
 * - `superadmin` target → only a `superadmin` may create it.
 * - any other privileged target (admin / manager / support) → only a `superadmin`.
 * - customer / delivery targets → an `admin` or a `superadmin`.
 */
export function canCreateRole(
  actorRole: Role | null | undefined,
  targetRole: Role,
): boolean {
  if (!actorRole) return false;

  if (targetRole === "superadmin") {
    return actorRole === "superadmin";
  }

  if (isPrivilegedRole(targetRole)) {
    return actorRole === "superadmin";
  }

  return actorRole === "admin" || actorRole === "superadmin";
}

/** Alias of {@link canCreateRole} used when changing an existing account's role. */
export function canAssignRole(
  actorRole: Role | null | undefined,
  targetRole: Role,
): boolean {
  return canCreateRole(actorRole, targetRole);
}

/**
 * The roles the actor may create, in the canonical display order
 * `superadmin → admin → manager → support → delivery → customer`.
 */
export function assignableRoles(actorRole: Role | null | undefined): Role[] {
  return ROLE_ORDER.filter((role) => canCreateRole(actorRole, role));
}

/** Narrows an arbitrary string to a known {@link Role}, or `null`. */
export function toRole(value: string | null | undefined): Role | null {
  if (!value) return null;
  return (ROLES as readonly string[]).includes(value) ? (value as Role) : null;
}

/** Returns the full permission set granted to a role. */
export function permissionsForRole(role: Role | null | undefined): Set<Permission> {
  const granted = new Set<Permission>();
  if (!role) return granted;

  for (const permission of Object.keys(PERMISSIONS) as Permission[]) {
    if (can(role, permission)) granted.add(permission);
  }
  return granted;
}
