"use client";

import { createClient } from "@/lib/supabase/client";
import { toArabicError, toAuthErrorMessage } from "@/lib/api/edge";
import type { Json } from "@/types/database.types";
import type { ActionResult, AvatarActionResult } from "@/features/profile/types";
import {
  MAX_PHONE_LENGTH,
  MIN_PASSWORD_LENGTH,
  validateFullName,
  validatePhone,
} from "@/features/profile/validation";

/** Public storage bucket that holds profile pictures. */
const AVATAR_BUCKET = "avatars";

/** File name stem (without extension) used for every profile picture. */
const AVATAR_FILE_STEM = "avatar";

/** Maximum accepted size of a profile picture (4 MB). */
const MAX_AVATAR_BYTES = 4 * 1024 * 1024;

/** MIME types accepted for a profile picture. */
const ALLOWED_AVATAR_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.");
  }

  return user;
}

/**
 * Updates the signed-in administrator's own profile row.
 *
 * Only `full_name`, `phone_number`, and `address` are written. The `email`
 * column is hardened and must never be updated from the client.
 */
export async function updateProfile(input: {
  fullName: string;
  phoneNumber: string;
  address: Json | null;
}): Promise<ActionResult> {
  try {
    const fullName = (input.fullName ?? "").trim();
    const phoneNumber = (input.phoneNumber ?? "").trim();

    const nameError = validateFullName(fullName);
    if (nameError) return { ok: false, error: nameError };

    if (phoneNumber.length > MAX_PHONE_LENGTH) {
      return { ok: false, error: "رقم الهاتف طويل جدًا." };
    }

    const phoneError = validatePhone(phoneNumber);
    if (phoneError) return { ok: false, error: phoneError };

    const user = await getCurrentUser();
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone_number: phoneNumber || null,
        address: input.address ?? null,
      })
      .eq("id", user.id);

    if (error) {
      console.error("تعذّر تحديث الملف الشخصي:", error.message);
      return { ok: false, error: "تعذّر حفظ التغييرات. حاول مرة أخرى." };
    }

    return { ok: true, message: "تم حفظ التغييرات بنجاح" };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/**
 * Changes the administrator's password by re-authenticating with the current
 * password and then updating the user through the browser auth SDK.
 */
export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}): Promise<ActionResult> {
  try {
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

    const user = await getCurrentUser();
    const email = user.email;
    if (!email) {
      return { ok: false, error: "تعذّر التحقق من كلمة المرور الحالية" };
    }

    const supabase = createClient();

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
      return { ok: false, error: toAuthErrorMessage(updateError) };
    }

    return { ok: true, message: "تم تغيير كلمة المرور بنجاح" };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/**
 * Uploads a profile picture for the signed-in administrator.
 *
 * Any previous picture in `avatars/<userId>/` is removed first so the folder
 * never contains more than one file and the derived URL never goes stale.
 */
export async function uploadAvatar(file: File): Promise<AvatarActionResult> {
  try {
    const extension = ALLOWED_AVATAR_TYPES[file.type];
    if (!extension) {
      return {
        ok: false,
        error: "صيغة الصورة غير مدعومة. استخدم PNG أو JPG أو WEBP.",
      };
    }

    if (file.size === 0) {
      return { ok: false, error: "تعذّر قراءة الصورة. حاول مرة أخرى." };
    }

    if (file.size > MAX_AVATAR_BYTES) {
      return { ok: false, error: "حجم الصورة يتجاوز 4 ميغابايت." };
    }

    const user = await getCurrentUser();
    const supabase = createClient();

    const { data: existing, error: listError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .list(user.id, { limit: 50 });

    if (listError) {
      console.error("تعذّر قراءة ملفات الصورة الشخصية:", listError.message);
      return { ok: false, error: "تعذّر رفع الصورة" };
    }

    const stalePaths = (existing ?? [])
      .filter((entry) => Boolean(entry.id))
      .map((entry) => `${user.id}/${entry.name}`);

    if (stalePaths.length > 0) {
      const { error: removeError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .remove(stalePaths);

      if (removeError) {
        console.error("تعذّر حذف الصورة القديمة:", removeError.message);
      }
    }

    const path = `${user.id}/${AVATAR_FILE_STEM}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("تعذّر رفع الصورة الشخصية:", uploadError.message);
      return { ok: false, error: "تعذّر رفع الصورة" };
    }

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);

    return {
      ok: true,
      message: "تم رفع الصورة",
      url: data?.publicUrl ?? null,
    };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/**
 * Removes every file stored under the signed-in administrator's own folder in
 * the `avatars` bucket. The UI falls back to initials afterwards.
 */
export async function removeAvatar(): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const supabase = createClient();

    const { data, error: listError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .list(user.id, { limit: 50 });

    if (listError) {
      console.error("تعذّر قراءة ملفات الصورة الشخصية:", listError.message);
      return { ok: false, error: "تعذّر إزالة الصورة" };
    }

    const paths = (data ?? [])
      .filter((entry) => Boolean(entry.id))
      .map((entry) => `${user.id}/${entry.name}`);

    if (paths.length === 0) {
      return { ok: true, message: "تمت إزالة الصورة" };
    }

    const { error: removeError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove(paths);

    if (removeError) {
      console.error("تعذّر حذف الصورة الشخصية:", removeError.message);
      return { ok: false, error: "تعذّر إزالة الصورة" };
    }

    return { ok: true, message: "تمت إزالة الصورة" };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}

/**
 * Signs the administrator out of every device by invalidating all sessions.
 *
 * The caller is responsible for redirecting the browser after success.
 */
export async function signOutAllDevices(): Promise<ActionResult> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut({ scope: "global" });

    if (error) {
      console.error("تعذّر تسجيل الخروج:", error.message);
      return { ok: false, error: "تعذّر تسجيل الخروج من جميع الأجهزة." };
    }

    return { ok: true, message: "تم تسجيل الخروج من جميع الأجهزة" };
  } catch (error) {
    return { ok: false, error: toArabicError(error) };
  }
}
