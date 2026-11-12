import "server-only";

import {
  type Permission,
  type Role,
  PERMISSION_DENIAL_MESSAGES,
  ROLE_LABELS,
  can,
  canCreateRole,
} from "@/lib/auth/permissions";
import { type SessionContext, getSessionContext } from "@/lib/auth/session";

/**
 * Thrown when the current session is missing or lacks a required permission.
 * `code === "FORBIDDEN"` is the machine-readable marker used by callers.
 */
export class PermissionError extends Error {
  code = "FORBIDDEN" as const;

  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}

/** Thrown when there is no authenticated session at all. */
export class UnauthorizedError extends Error {
  code = "UNAUTHORIZED" as const;

  constructor(message = "يجب تسجيل الدخول أولًا للمتابعة.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Asserts that the current session holds `permission`.
 *
 * MUST be called before any privileged database write. The role is always
 * read from the server-side `profiles` row — never from the client.
 */
export async function assertPermission(
  permission: Permission,
): Promise<SessionContext> {
  const session = await getSessionContext();

  if (!session) {
    throw new UnauthorizedError();
  }

  if (!can(session.role, permission)) {
    throw new PermissionError(
      PERMISSION_DENIAL_MESSAGES[permission] ?? "لا تملك صلاحية تنفيذ هذا الإجراء.",
    );
  }

  return session;
}

/**
 * Asserts that the current session holds at least one of `permissions`.
 */
export async function assertAnyPermission(
  ...permissions: Permission[]
): Promise<SessionContext> {
  const session = await getSessionContext();

  if (!session) {
    throw new UnauthorizedError();
  }

  if (!permissions.some((permission) => can(session.role, permission))) {
    throw new PermissionError(
      PERMISSION_DENIAL_MESSAGES[permissions[0]] ??
        "لا تملك صلاحية تنفيذ هذا الإجراء.",
    );
  }

  return session;
}

/**
 * Asserts that the current session may create / assign accounts with
 * `targetRole`.
 */
export async function assertCanCreateRole(
  targetRole: Role,
): Promise<SessionContext> {
  const session = await getSessionContext();

  if (!session) {
    throw new UnauthorizedError();
  }

  if (!canCreateRole(session.role, targetRole)) {
    throw new PermissionError(
      session.role === "superadmin"
        ? "لا تملك صلاحية إنشاء هذا الدور."
        : `إنشاء حسابات بدور «${ROLE_LABELS[targetRole]}» متاح للمدير الأعلى فقط.`,
    );
  }

  return session;
}
