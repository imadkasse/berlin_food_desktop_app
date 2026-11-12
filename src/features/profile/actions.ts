"use server";

import { redirect } from "next/navigation";

import {
  PermissionError,
  UnauthorizedError,
  assertPermission,
} from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import {
  AVATAR_BUCKET,
  AVATAR_FILE_STEM,
  removeAvatarFiles,
} from "@/services/profile";
import type { Json } from "@/types/database.types";
import type { ActionResult, AvatarActionResult } from "@/features/profile/types";
import {
  MAX_PHONE_LENGTH,
  MIN_PASSWORD_LENGTH,
  validateFullName,
  validatePhone,
} from "@/features/profile/validation";

/* -------------------------------------------------------------------------- */
/*                                  Constants                                  */
/* -------------------------------------------------------------------------- */

/** Maximum accepted size of a profile picture (4 MB). */
const MAX_AVATAR_BYTES = 4 * 1024 * 1024;

/** MIME types accepted for a profile picture. */
const ALLOWED_AVATAR_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/* -------------------------------------------------------------------------- */
/*                                Error helpers                               */
/* -------------------------------------------------------------------------- */

/**
 * `true` when the error is one of the guard errors
 * (`PermissionError` / `UnauthorizedError`).
 *
 * The `name` check is a fallback for the (unlikely) case where the error
 * crossed a module boundary and lost its prototype identity.
 */
function isGuardError(error: unknown): boolean {
  if (error instanceof PermissionError || error instanceof UnauthorizedError) {
    return true;
  }

  if (error && typeof error === "object" && "name" in error) {
    const name = (error as { name?: unknown }).name;
    return name === "PermissionError" || name === "UnauthorizedError";
  }

  return false;
}

/**
 * Turns any thrown error into an Arabic, user-facing message.
 *
 * Permission problems keep their dedicated wording — the guard already writes
 * it in Arabic — while anything unexpected is reported generically so that no
 * technical detail (SQL / PostgREST text) leaks into the UI.
 */
function toArabicError(error: unknown): string {
  if (error instanceof Error && isGuardError(error)) {
    return error.message;
  }

  console.error("تعذّر تنفيذ عملية على الملف الشخصي:", error);
  return "تعذّر تنفيذ العملية. حاول مرة أخرى.";
}

/**
 * Detects the control-flow error that Next.js throws for `redirect()`.
 *
 * The digest of such an error always starts with `NEXT_REDIRECT`. A catch
 * block must re-throw it instead of swallowing it, otherwise the redirect
 * would be turned into a plain error message.
 */
function isRedirectError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

/* -------------------------------------------------------------------------- */
/*                                Profile update                               */
/* -------------------------------------------------------------------------- */

/**
 * Updates the **own** profile of the signed-in administrator.
 *
 * Security:
 * - `assertPermission("profile.write")` reads the role from the server-side
 *   `profiles` row — the client can never influence it.
 * - The row is addressed by `session.user.id`, so a caller can only ever
 *   modify their own profile (self-only).
 * - `role` and `id` are never part of the payload, therefore they cannot be
 *   tampered with. `role` additionally has no column-level grant for the
 *   `authenticated` role.
 */
export async function updateProfileAction(input: {
  fullName: string;
  phoneNumber: string;
  address: Json | null;
}): Promise<ActionResult> {
  try {
    const session = await assertPermission("profile.write");

    const fullName = (input.fullName ?? "").trim();
    const phoneNumber = (input.phoneNumber ?? "").trim();

    const nameError = validateFullName(fullName);
    if (nameError) return { ok: false, error: nameError };

    if (phoneNumber.length > MAX_PHONE_LENGTH) {
      return { ok: false, error: "رقم الهاتف طويل جدًا." };
    }

    const phoneError = validatePhone(phoneNumber);
    if (phoneError) return { ok: false, error: phoneError };

    const admin = createAdminClient();

    const { error } = await admin
      .from("profiles")
      .update({
        full_name: fullName,
        phone_number: phoneNumber || null,
        address: input.address ?? null,
      })
      .eq("id", session.user.id);

    if (error) {
      console.error("تعذّر تحديث الملف الشخصي:", error.message);
      return { ok: false, error: "تعذّر حفظ التغييرات. حاول مرة أخرى." };
    }

    return { ok: true, message: "تم حفظ التغييرات بنجاح" };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { ok: false, error: toArabicError(error) };
  }
}

/* -------------------------------------------------------------------------- */
/*                              Password change                                */
/* -------------------------------------------------------------------------- */

/**
 * Changes the password of the signed-in administrator.
 *
 * The current password is verified by re-authenticating with the *session*
 * client (the publishable key bound to the request cookies) — the service
 * role is never used for authentication so that a wrong password cannot be
 * bypassed.
 */
export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}): Promise<ActionResult> {
  try {
    const session = await assertPermission("profile.write");

    const currentPassword = input.currentPassword ?? "";
    const newPassword = input.newPassword ?? "";

    if (!currentPassword) {
      return { ok: false, error: "كلمة المرور الحالية مطلوبة." };
    }

    if (!newPassword) {
      return { ok: false, error: "كلمة المرور الجديدة مطلوبة." };
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return {
        ok: false,
        error: `كلمة المرور الجديدة يجب ألا تقل عن ${MIN_PASSWORD_LENGTH} أحرف.`,
      };
    }

    if (newPassword === currentPassword) {
      return {
        ok: false,
        error: "كلمة المرور الجديدة يجب أن تختلف عن كلمة المرور الحالية.",
      };
    }

    if (
      input.confirmPassword !== undefined &&
      input.confirmPassword !== newPassword
    ) {
      return { ok: false, error: "كلمتا المرور غير متطابقتين." };
    }

    const supabase = await createServerClient();

    const email = session.user.email;
    if (!email) {
      return { ok: false, error: "تعذّر التحقق من كلمة المرور الحالية" };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      return { ok: false, error: "كلمة المرور الحالية غير صحيحة" };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("تعذّر تغيير كلمة المرور:", updateError.message);
      return { ok: false, error: "تعذّر تغيير كلمة المرور" };
    }

    return { ok: true, message: "تم تغيير كلمة المرور بنجاح" };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { ok: false, error: toArabicError(error) };
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Avatar upload                               */
/* -------------------------------------------------------------------------- */

/**
 * Uploads the profile picture of the signed-in administrator.
 *
 * The file is stored in the public `avatars` bucket under the user's own
 * folder — `<userId>/avatar.<ext>` — which is exactly what the bucket storage
 * policy allows. Any previous picture is removed first so the folder never
 * contains more than one file and the derived URL never goes stale.
 */
export async function uploadAvatarAction(input: {
  fileName: string;
  base64: string;
  contentType: string;
}): Promise<AvatarActionResult> {
  try {
    const session = await assertPermission("profile.write");

    const extension = ALLOWED_AVATAR_TYPES[input.contentType];
    if (!extension) {
      return {
        ok: false,
        error: "صيغة الصورة غير مدعومة. استخدم PNG أو JPG أو WEBP.",
      };
    }

    if (!input.base64) {
      return { ok: false, error: "تعذّر قراءة الصورة. حاول مرة أخرى." };
    }

    const buffer = Buffer.from(input.base64, "base64");

    if (buffer.byteLength === 0) {
      return { ok: false, error: "تعذّر قراءة الصورة. حاول مرة أخرى." };
    }

    if (buffer.byteLength > MAX_AVATAR_BYTES) {
      return { ok: false, error: "حجم الصورة يتجاوز 4 ميغابايت." };
    }

    const admin = createAdminClient();

    // Only one picture may live in the user's folder.
    const { data: existing } = await admin.storage
      .from(AVATAR_BUCKET)
      .list(session.user.id, { limit: 50 });

    const stalePaths = (existing ?? [])
      .filter((entry) => Boolean(entry.id))
      .map((entry) => `${session.user.id}/${entry.name}`);

    if (stalePaths.length > 0) {
      await admin.storage.from(AVATAR_BUCKET).remove(stalePaths);
    }

    const path = `${session.user.id}/${AVATAR_FILE_STEM}.${extension}`;

    const { error } = await admin.storage
      .from(AVATAR_BUCKET)
      .upload(path, buffer, {
        contentType: input.contentType,
        upsert: true,
      });

    if (error) {
      console.error("تعذّر رفع الصورة الشخصية:", error.message);
      return { ok: false, error: "تعذّر رفع الصورة" };
    }

    const { data } = admin.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(path);

    return { ok: true, message: "تم رفع الصورة", url: data?.publicUrl ?? null };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { ok: false, error: toArabicError(error) };
  }
}

/**
 * Removes the profile picture of the signed-in administrator.
 *
 * The UI falls back to the initials of the administrator afterwards.
 */
export async function removeAvatarAction(): Promise<ActionResult> {
  try {
    const session = await assertPermission("profile.write");

    const removed = await removeAvatarFiles(session.user.id);
    if (!removed) {
      return { ok: false, error: "تعذّر إزالة الصورة" };
    }

    return { ok: true, message: "تمت إزالة الصورة" };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { ok: false, error: toArabicError(error) };
  }
}

/* -------------------------------------------------------------------------- */
/*                              Sign out everywhere                            */
/* -------------------------------------------------------------------------- */

/**
 * Signs the administrator out of **all** devices and redirects to `/login`.
 *
 * The session cookie is cleared by the server, so the browser cannot restore
 * the previous session.
 */
export async function signOutAllDevicesAction(): Promise<ActionResult> {
  try {
    await assertPermission("profile.write");

    const supabase = await createServerClient();

    const { error } = await supabase.auth.signOut({ scope: "global" });

    if (error) {
      console.error("تعذّر تسجيل الخروج:", error.message);
      return { ok: false, error: "تعذّر تسجيل الخروج من جميع الأجهزة." };
    }

    // `redirect()` never returns — it throws a control-flow error that the
    // catch block below re-throws untouched (see `isRedirectError`).
    redirect("/login");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { ok: false, error: toArabicError(error) };
  }
}
