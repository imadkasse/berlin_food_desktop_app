"use server";

import { revalidatePath } from "next/cache";

import {
  PermissionError,
  UnauthorizedError,
  assertPermission,
} from "@/lib/auth/guard";
import type { Role } from "@/lib/auth/permissions";
import { deleteUserAction, updateUserRoleAction } from "@/features/users/actions";
import type { ActionResult } from "@/features/users/types";

/**
 * Berlin Food — Admins feature actions.
 *
 * The mutations themselves are **not** re-implemented here: the audited
 * actions of `src/features/users/actions.ts` do the work (they own the
 * validation, the RBAC gate and the write through the service-role client).
 * These thin wrappers only add what is specific to the administrators area:
 *
 * - the self-demotion guard (a superadmin may never take their own role away,
 *   it would lock the platform out of the superadmin tier);
 * - the revalidation of the `/dashboard/admins` route, which the shared
 *   actions do not know about.
 */

/** The pages that have to be refreshed after a mutation. */
const ADMINS_PATH = "/dashboard/admins";

/** The Arabic message returned when a superadmin tries to demote themself. */
const SELF_ROLE_CHANGE_ERROR = "لا يمكنك تغيير دورك الحالي.";

/** The Arabic message returned when a superadmin tries to delete themself. */
const SELF_DELETE_ERROR = "لا يمكنك حذف حسابك الحالي.";

/**
 * Turns any thrown error into an Arabic, user-facing message.
 *
 * Permission problems keep their dedicated wording — the guard already writes
 * it in Arabic — while anything unexpected is reported generically so that no
 * technical detail leaks into the UI.
 */
function toArabicError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "PermissionError" || error.name === "UnauthorizedError") {
      return error.message;
    }
  }

  console.error("تعذّر تنفيذ عملية على حسابات المشرفين:", error);

  return "تعذّر حفظ التغييرات. حاول مرة أخرى.";
}

/**
 * Changes the role of an account listed in the administrators area.
 *
 * Security:
 * - `assertPermission("admins.manage")` reads the role from the server-side
 *   `profiles` row — the client can never influence it.
 * - the **self-demotion guard**: the signed-in administrator may not move
 *   their own account away from `superadmin`; doing so would leave the
 *   platform without a single account able to manage the other ones.
 * - the write itself is delegated to `updateUserRoleAction`, which applies the
 *   shared RBAC matrix (`assertCanCreateRole`) and writes through the
 *   service-role client.
 */
export async function changeAdminRoleAction(input: {
  id: string;
  role: Role;
}): Promise<ActionResult> {
  try {
    const session = await assertPermission("admins.manage");

    if (input.id === session.user.id && input.role !== "superadmin") {
      return { ok: false, error: SELF_ROLE_CHANGE_ERROR };
    }

    const result = await updateUserRoleAction(input);

    if (result.ok) {
      revalidatePath(ADMINS_PATH);
    }

    return result;
  } catch (error) {
    if (error instanceof PermissionError || error instanceof UnauthorizedError) {
      return { ok: false, error: error.message };
    }

    return { ok: false, error: toArabicError(error) };
  }
}

/**
 * Deletes an account listed in the administrators area.
 *
 * Security:
 * - `assertPermission("admins.manage")` — the administrators area is
 *   superadmin-only.
 * - the account of the signed-in administrator is protected: deleting it
 *   would end the session of the very person performing the action.
 * - the deletion itself is delegated to `deleteUserAction`, which applies the
 *   `users.delete` gate and removes the account through the service-role
 *   client.
 */
export async function deleteAdminAccountAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    const session = await assertPermission("admins.manage");

    if (input.id === session.user.id) {
      return { ok: false, error: SELF_DELETE_ERROR };
    }

    const result = await deleteUserAction({ id: input.id });

    if (result.ok) {
      revalidatePath(ADMINS_PATH);
    }

    return result;
  } catch (error) {
    if (error instanceof PermissionError || error instanceof UnauthorizedError) {
      return { ok: false, error: error.message };
    }

    return { ok: false, error: toArabicError(error) };
  }
}
