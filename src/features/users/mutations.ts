"use client";

import { invokeEdge, toArabicError } from "@/lib/api/edge";
import { createClient } from "@/lib/supabase/client";
import type { ActionResult } from "@/features/users/types";
import { isRole, isUserId } from "@/features/users/validation";
import type { Role } from "@/types/app";

/**
 * Berlin Food — Users mutations.
 *
 * Privileged writes (account creation, profile / e-mail changes, role changes
 * and deletions) run through the Supabase Edge Functions, which re-assert the
 * caller's permissions server-side. Only the availability flag is written
 * directly through the browser client, because the `authenticated` role holds
 * the matching column grant on `profiles.availability_status`.
 *
 * The client checks below are input guards, not security boundaries.
 */

export type CreateUserInput = {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  role: Role;
  vehicleType?: string | null;
  address?: string | null;
};

export type UpdateUserInput = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  vehicleType?: string | null;
  availabilityStatus?: boolean | null;
  address?: string | null;
};

export type UpdateUserRoleInput = {
  id: string;
  role: Role;
};

export type SetUserAvailabilityInput = {
  id: string;
  available: boolean;
};

/** Creates a new platform account through `admin-create-user`. */
export async function createUser(
  input: CreateUserInput,
): Promise<ActionResult> {
  const body: Record<string, unknown> = {
    email: input.email.trim(),
    password: input.password,
    fullName: input.fullName.trim(),
    phoneNumber: input.phoneNumber.trim(),
    role: input.role,
  };

  const vehicleType = (input.vehicleType ?? "").trim();
  if (vehicleType) body.vehicleType = vehicleType;

  const address = (input.address ?? "").trim();
  if (address) body.address = address;

  return invokeEdge<ActionResult>("admin-create-user", body);
}

/** Updates the editable profile fields through `admin-update-user`. */
export async function updateUser(
  input: UpdateUserInput,
): Promise<ActionResult> {
  const id = (input.id ?? "").trim();

  if (!isUserId(id)) {
    return { ok: false, error: "الحساب غير موجود." };
  }

  return invokeEdge<ActionResult>("admin-update-user", {
    id,
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    phoneNumber: input.phoneNumber.trim(),
    vehicleType: (input.vehicleType ?? "").trim() || null,
    availabilityStatus: input.availabilityStatus ?? null,
    address: (input.address ?? "").trim() || null,
  });
}

/** Changes the role of an account through `admin-set-role`. */
export async function updateUserRole(
  input: UpdateUserRoleInput,
): Promise<ActionResult> {
  const id = (input.id ?? "").trim();

  if (!isUserId(id)) {
    return { ok: false, error: "الحساب غير موجود." };
  }

  if (!isRole(input.role)) {
    return { ok: false, error: "الدور غير صالح." };
  }

  return invokeEdge<ActionResult>("admin-set-role", {
    id,
    role: input.role,
  });
}

/**
 * Flips the availability flag of an account.
 *
 * This is the only mutation written through the browser SDK: the
 * `authenticated` role holds the column grant on `profiles.availability_status`
 * and RLS decides whether the signed-in administrator may touch the row.
 */
export async function setUserAvailability({
  id,
  available,
}: SetUserAvailabilityInput): Promise<ActionResult> {
  const userId = (id ?? "").trim();

  if (!isUserId(userId)) {
    return { ok: false, error: "الحساب غير موجود." };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ availability_status: Boolean(available) })
      .eq("id", userId);

    if (error) throw error;

    return {
      ok: true,
      message: available
        ? "تم تفعيل الحساب بنجاح"
        : "تم إيقاف الحساب بنجاح",
    };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/** Deletes a platform account through `admin-delete-user`. */
export async function deleteUser({
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
