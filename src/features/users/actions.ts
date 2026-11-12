"use server";

import { revalidatePath } from "next/cache";

import {
  PermissionError,
  assertCanCreateRole,
  assertPermission,
} from "@/lib/auth/guard";
import { createAdminClient, type SupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createUserAccount,
  deleteUserAccount,
  fetchUserById,
  fetchUserAuthEmail,
  updateUserAuthEmail,
  updateUserAvailability,
  updateUserProfile,
  updateUserRole,
} from "@/services/users";
import type { ActionResult } from "@/features/users/types";
import {
  isRole,
  isUserId,
  validateCreateUserInput,
  validateUpdateUserInput,
} from "@/features/users/validation";
import type { Role } from "@/types/app";

export type { ActionResult };

/** The pages that have to be refreshed after a mutation. */
const USERS_PATH = "/dashboard/users";

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

/**
 * The rank of a role — `-1` when the role is unknown (or missing).
 *
 * An unknown role is treated as the lowest possible rank, so it can never
 * lock an administrator out of a customer-like account.
 */
function roleRank(role: string | null | undefined): number {
  if (!role) return -1;
  return ROLE_RANK[role] ?? -1;
}

/**
 * Checks that the actor may modify the target account.
 *
 * The target profile is read from the **service-role** client, so the role
 * that decides the outcome is never the one the client sent.
 *
 * Returns `ok` when the modification is allowed, or the Arabic error message
 * when it is not.
 */
async function checkTargetPrivilege(
  admin: SupabaseAdminClient,
  actorRole: Role | null,
  targetId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const target = await fetchUserById(admin, targetId);

  if (!target) {
    return { ok: false, error: "الحساب غير موجود." };
  }

  // Only accounts that sit **below** the actor may be modified — an `admin`
  // can therefore never touch another `admin` nor a `superadmin`.
  if (roleRank(target.role) >= roleRank(actorRole)) {
    return { ok: false, error: HIGHER_ROLE_ERROR };
  }

  return { ok: true };
}

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
  console.error("تعذّر تنفيذ عملية على المستخدمين:", error);
  return "تعذّر حفظ التغييرات. حاول مرة أخرى.";
}

/**
 * Translates the Supabase auth errors into Arabic messages the admin can act
 * upon.
 */
function toAuthErrorMessage(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : "";

  if (/already been registered|already registered|email_exists/i.test(message)) {
    return "هذا البريد الإلكتروني مسجّل مسبقًا في المنصة.";
  }

  if (/password should be at least/i.test(message)) {
    return "كلمة المرور قصيرة جدًا — يجب ألا تقل عن 8 أحرف.";
  }

  if (/email address invalid|email not valid/i.test(message)) {
    return "البريد الإلكتروني غير صالح.";
  }

  if (/User not found/i.test(message)) {
    return "الحساب غير موجود.";
  }

  console.error("تعذّر إنشاء الحساب:", error);

  return "تعذّر إنشاء الحساب. حاول مرة أخرى.";
}

/* -------------------------------------------------------------------------- */
/*                                  Create                                    */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new platform account.
 *
 * Security:
 * - `assertPermission("users.write")` reads the role from the server-side
 *   `profiles` row — the client can never influence it.
 * - `assertCanCreateRole(input.role)` is the RBAC gate: a `superadmin` may
 *   create every role, an `admin` may only create `customer` / `delivery`
 *   accounts. The role sent by the client is never trusted.
 * - The account is created through the service-role client, because the
 *   `authenticated` role has no column-level grant on `profiles.role`.
 */
export async function createUserAction(input: {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: Role;
  vehicleType?: string | null;
  address?: string | null;
}): Promise<ActionResult> {
  try {
    await assertPermission("users.write");

    const validation = validateCreateUserInput(input);
    if (!validation.ok) {
      const firstError =
        validation.errors.fullName ??
        validation.errors.email ??
        validation.errors.phoneNumber ??
        validation.errors.password ??
        validation.errors.role;
      return { ok: false, error: firstError ?? "بيانات الحساب غير صالحة." };
    }

    // The RBAC gate — the role always comes from the server-side session.
    await assertCanCreateRole(validation.data.role);

    const admin = createAdminClient();

    const isCourier = validation.data.role === "delivery";

    await createUserAccount(admin, {
      email: validation.data.email,
      password: validation.data.password,
      fullName: validation.data.fullName,
      phoneNumber: validation.data.phoneNumber,
      role: validation.data.role,
      vehicleType: isCourier ? (validation.data.vehicleType ?? "motorcycle") : null,
      availabilityStatus: isCourier ? true : null,
      address: validation.data.address
        ? { label: validation.data.address }
        : null,
    });

    revalidatePath(USERS_PATH);

    return { ok: true, message: "تم إنشاء الحساب بنجاح" };
  } catch (error) {
    if (error instanceof PermissionError) {
      return { ok: false, error: error.message };
    }

    if (error && typeof error === "object" && "message" in error) {
      return { ok: false, error: toAuthErrorMessage(error) };
    }

    return { ok: false, error: toArabicError(error) };
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Update                                    */
/* -------------------------------------------------------------------------- */

/**
 * Updates the editable fields of a user (name, e-mail, phone, vehicle,
 * availability and address).
 *
 * The `role` is **not** part of the payload on purpose — a role change is a
 * separate, privileged operation (`updateUserRoleAction`).
 *
 * Security:
 * - The target must sit **strictly below** the actor in the privilege ladder
 *   (see {@link checkTargetPrivilege}), so an `admin` can never rewrite the
 *   profile of another `admin` nor of a `superadmin`.
 * - The e-mail is written to `auth.users` as well, so `auth.users.email` and
 *   `profiles.email` (the courier-matching key) can never drift apart.
 */
export async function updateUserAction(input: {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  vehicleType?: string | null;
  availabilityStatus?: boolean | null;
  address?: string | null;
}): Promise<ActionResult> {
  try {
    const session = await assertPermission("users.write");

    const validation = validateUpdateUserInput(input);
    if (!validation.ok) {
      const firstError =
        validation.errors.fullName ??
        validation.errors.email ??
        validation.errors.phoneNumber;
      return { ok: false, error: firstError ?? "بيانات الحساب غير صالحة." };
    }

    const admin = createAdminClient();

    // The RBAC gate — the target role is read from the server-side profile.
    const privilege = await checkTargetPrivilege(
      admin,
      session.role,
      validation.data.id,
    );

    if (!privilege.ok) {
      return { ok: false, error: privilege.error };
    }

    // `auth.users.email` is the login identity — it has to follow the new
    // address, otherwise the two e-mail columns drift apart.
    const authEmail = await fetchUserAuthEmail(admin, validation.data.id);

    if (authEmail !== validation.data.email) {
      await updateUserAuthEmail(admin, validation.data.id, validation.data.email);
    }

    await updateUserProfile(admin, validation.data.id, {
      fullName: validation.data.fullName,
      email: validation.data.email,
      phoneNumber: validation.data.phoneNumber,
      vehicleType: validation.data.vehicleType,
      availabilityStatus: validation.data.availabilityStatus,
      address: validation.data.address
        ? { label: validation.data.address }
        : null,
    });

    revalidatePath(USERS_PATH);
    revalidatePath(`${USERS_PATH}/${validation.data.id}`);

    return { ok: true, message: "تم حفظ التغييرات بنجاح" };
  } catch (error) {
    if (error instanceof PermissionError) {
      return { ok: false, error: error.message };
    }

    if (error && typeof error === "object" && "message" in error) {
      return { ok: false, error: toAuthErrorMessage(error) };
    }

    return { ok: false, error: toArabicError(error) };
  }
}

/* -------------------------------------------------------------------------- */
/*                                Role change                                 */
/* -------------------------------------------------------------------------- */

/**
 * Changes the role of an existing account.
 *
 * Security:
 * - `assertPermission("roles.manage")` — only a `superadmin` may change roles
 *   at all.
 * - `assertCanCreateRole(targetRole)` — the same matrix as the creation, so a
 *   `superadmin` can never be created by accident and an `admin` can never
 *   promote somebody.
 * - The write goes through the service-role client, because the
 *   `authenticated` role has no column-level grant on `profiles.role`.
 */
export async function updateUserRoleAction(input: {
  id: string;
  role: Role;
}): Promise<ActionResult> {
  try {
    await assertPermission("roles.manage");

    const id = (input.id ?? "").trim();
    if (!id) {
      return { ok: false, error: "الحساب غير موجود." };
    }

    if (!isUserId(id)) {
      return { ok: false, error: "الحساب غير موجود." };
    }

    if (!isRole(input.role)) {
      return { ok: false, error: "الدور غير صالح." };
    }

    // The RBAC gate — the target role is validated against the actor's role.
    await assertCanCreateRole(input.role);

    const admin = createAdminClient();
    await updateUserRole(admin, id, input.role);

    revalidatePath(USERS_PATH);
    revalidatePath(`${USERS_PATH}/${id}`);

    return { ok: true, message: "تم تغيير دور الحساب بنجاح" };
  } catch (error) {
    if (error instanceof PermissionError) {
      return { ok: false, error: error.message };
    }

    return { ok: false, error: toArabicError(error) };
  }
}

/* -------------------------------------------------------------------------- */
/*                                Availability                                 */
/* -------------------------------------------------------------------------- */

/**
 * Flips the availability of a delivery account.
 *
 * Security: the target must sit **strictly below** the actor in the privilege
 * ladder — an `admin` can therefore never disable another `admin` nor a
 * `superadmin` (see {@link checkTargetPrivilege}).
 */
export async function setUserAvailabilityAction(input: {
  id: string;
  available: boolean;
}): Promise<ActionResult> {
  try {
    const session = await assertPermission("users.write");

    const id = (input.id ?? "").trim();
    if (!id) {
      return { ok: false, error: "الحساب غير موجود." };
    }

    if (!isUserId(id)) {
      return { ok: false, error: "الحساب غير موجود." };
    }

    const admin = createAdminClient();

    const privilege = await checkTargetPrivilege(admin, session.role, id);
    if (!privilege.ok) {
      return { ok: false, error: privilege.error };
    }

    await updateUserAvailability(admin, id, Boolean(input.available));

    revalidatePath(USERS_PATH);
    revalidatePath(`${USERS_PATH}/${id}`);

    return {
      ok: true,
      message: input.available
        ? "تم تفعيل الحساب بنجاح"
        : "تم إيقاف الحساب بنجاح",
    };
  } catch (error) {
    if (error instanceof PermissionError) {
      return { ok: false, error: error.message };
    }

    return { ok: false, error: toArabicError(error) };
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Delete                                    */
/* -------------------------------------------------------------------------- */

/**
 * Deletes a platform account permanently.
 *
 * `users.delete` is held by the `superadmin` only.
 */
export async function deleteUserAction(input: {
  id: string;
}): Promise<ActionResult> {
  try {
    await assertPermission("users.delete");

    const id = (input.id ?? "").trim();
    if (!id) {
      return { ok: false, error: "الحساب غير موجود." };
    }

    if (!isUserId(id)) {
      return { ok: false, error: "الحساب غير موجود." };
    }

    const admin = createAdminClient();
    await deleteUserAccount(admin, id);

    revalidatePath(USERS_PATH);

    return { ok: true, message: "تم حذف الحساب بنجاح" };
  } catch (error) {
    if (error instanceof PermissionError) {
      return { ok: false, error: error.message };
    }

    return { ok: false, error: toArabicError(error) };
  }
}
