/**
 * Berlin Food — Edge Function RBAC assertions and privilege ladder.
 *
 * Replicates the server-side guard logic from `src/lib/auth/guard.ts` and the
 * privilege ladder from `src/features/users/actions.ts`.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Permission, Profile, Role } from "./types.ts";
import {
  PERMISSION_DENIAL_MESSAGES,
  ROLE_LABELS,
  can,
  canCreateRole,
} from "./permissions.ts";

/** Thrown when there is no authenticated session at all. */
export class UnauthorizedError extends Error {
  code = "UNAUTHORIZED" as const;

  constructor(message = "يجب تسجيل الدخول أولًا للمتابعة.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Thrown when the session lacks a required permission or privilege. */
export class ForbiddenError extends Error {
  code = "FORBIDDEN" as const;

  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Edge Function session shape produced by `verifyCaller`. */
export type Session = {
  user: { id: string };
  profile: Profile;
  role: Role;
  permissions: ReadonlySet<Permission>;
};

/** Asserts that the session holds `permission`. */
export function assertPermission(session: Session, permission: Permission): Session {
  if (!can(session.role, permission)) {
    throw new ForbiddenError(
      PERMISSION_DENIAL_MESSAGES[permission] ?? "لا تملك صلاحية تنفيذ هذا الإجراء.",
    );
  }

  return session;
}

/** Asserts that the session may create / assign accounts with `targetRole`. */
export function assertCanCreateRole(session: Session, targetRole: Role): Session {
  if (!canCreateRole(session.role, targetRole)) {
    throw new ForbiddenError(
      session.role === "superadmin"
        ? "لا تملك صلاحية إنشاء هذا الدور."
        : `إنشاء حسابات بدور «${ROLE_LABELS[targetRole]}» متاح للمدير الأعلى فقط.`,
    );
  }

  return session;
}

/* -------------------------------------------------------------------------- */
/*                           Privilege ladder                                 */
/* -------------------------------------------------------------------------- */

/**
 * The privilege ladder of the platform.
 *
 * The rank of a role decides which accounts an actor may touch: an actor may
 * only modify accounts whose rank is **strictly below** its own.
 */
const ROLE_RANK: Record<string, number> = {
  customer: 0,
  delivery: 1,
  support: 2,
  manager: 3,
  admin: 4,
  superadmin: 5,
};

/** The Arabic message returned when the target outranks the actor. */
const HIGHER_ROLE_ERROR =
  "لا يمكنك تعديل حساب بصلاحية إدارية أعلى من صلاحياتك.";

/** Returns the numeric rank of a role, or `-1` when unknown/missing. */
function roleRank(role: string | null | undefined): number {
  if (!role) return -1;
  return ROLE_RANK[role] ?? -1;
}

/**
 * Checks that the actor may modify the target account.
 *
 * The target profile is read from the service-role client so the role that
 * decides the outcome is never the one the client sent.
 *
 * Returns `ok` when the modification is allowed, or the Arabic error message
 * when it is not.
 */
export async function checkTargetPrivilege(
  admin: SupabaseClient,
  actorRole: Role | null,
  targetId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: target, error } = await admin
    .from("profiles")
    .select<string, { role: string | null }>("role")
    .eq("id", targetId)
    .maybeSingle();

  if (error) {
    console.error("تعذّر قراءة بيانات الحساب المستهدف:", error.message);
    return { ok: false, error: "تعذّر التحقق من بيانات الحساب." };
  }

  if (!target) {
    return { ok: false, error: "الحساب غير موجود." };
  }

  // Only accounts that sit **below** the actor may be modified.
  if (roleRank(target.role) >= roleRank(actorRole)) {
    return { ok: false, error: HIGHER_ROLE_ERROR };
  }

  return { ok: true };
}
