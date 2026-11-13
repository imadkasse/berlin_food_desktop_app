"use client";

import { invokeEdge } from "@/lib/api/edge";
import type { Role } from "@/lib/auth/permissions";
import type { ActionResult } from "@/features/users/types";
import { isRole, isUserId } from "@/features/users/validation";

/**
 * Berlin Food — Admins mutations.
 *
 * Both writes go through the Edge Functions, which re-assert
 * `admins.manage` server-side and enforce the self-demotion / self-delete
 * guards. The client only surfaces the Arabic error returned by the function.
 */

/** Changes the role of an account of the administrative tier. */
export async function changeAdminRole({
  id,
  role,
}: {
  id: string;
  role: Role;
}): Promise<ActionResult> {
  const userId = (id ?? "").trim();

  if (!isUserId(userId)) {
    return { ok: false, error: "الحساب غير موجود." };
  }

  if (!isRole(role)) {
    return { ok: false, error: "الدور غير صالح." };
  }

  return invokeEdge<ActionResult>("admin-set-role", { id: userId, role });
}

/** Deletes an account of the administrative tier. */
export async function deleteAdminAccount({
  id,
}: {
  id: string;
}): Promise<ActionResult> {
  const userId = (id ?? "").trim();

  if (!isUserId(userId)) {
    return { ok: false, error: "الحساب غير موجود." };
  }

  return invokeEdge<ActionResult>("admin-delete-user", { id: userId });
}
