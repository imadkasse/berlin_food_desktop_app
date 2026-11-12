import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionContext } from "@/lib/auth/session";
import type { ProfileView } from "@/features/profile/types";

/**
 * Berlin Food — Profile service (server only).
 *
 * The `profiles` table has **no** `avatar_url` column, so the avatar URL is
 * derived deterministically from the storage layout instead of being stored:
 *
 *   <supabase-url>/storage/v1/object/public/avatars/<userId>/avatar.<ext>
 *
 * The extension is not persisted anywhere, therefore the file is located by
 * listing the user's own folder in the public `avatars` bucket. This is
 * honest, needs no schema change, and matches the bucket policy that only
 * allows an authenticated user to write under `<userId>/`.
 */

/** The public storage bucket that holds profile pictures. */
export const AVATAR_BUCKET = "avatars";

/** The file name (without extension) used for every profile picture. */
export const AVATAR_FILE_STEM = "avatar";

/** Extensions accepted for a profile picture. */
export const AVATAR_EXTENSIONS = ["png", "jpg", "jpeg", "webp"] as const;

/**
 * Lists the files stored under the user's own folder in the `avatars` bucket.
 *
 * Returns an empty array when the folder does not exist yet.
 */
export async function listAvatarFiles(userId: string): Promise<string[]> {
  if (!userId) return [];

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(AVATAR_BUCKET)
    .list(userId, { limit: 50 });

  if (error) {
    console.error("تعذّر قراءة ملفات الصورة الشخصية:", error.message);
    return [];
  }

  return (data ?? [])
    // Folder placeholders have `id === null` — only real files are relevant.
    .filter((entry) => Boolean(entry.id) && entry.name !== AVATAR_FILE_STEM)
    .map((entry) => entry.name);
}

/**
 * Resolves the public URL of the profile picture of `userId`.
 *
 * Returns `null` when no picture has been uploaded yet — the UI then falls
 * back to the avatar initials.
 */
export async function getAvatarUrl(userId: string): Promise<string | null> {
  const files = await listAvatarFiles(userId);
  const file = files.find((name) => name.startsWith(`${AVATAR_FILE_STEM}.`));

  if (!file) return null;

  const admin = createAdminClient();
  const { data } = admin.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(`${userId}/${file}`);

  return data?.publicUrl ?? null;
}

/**
 * Deletes every file stored under the user's own folder in the `avatars`
 * bucket — used when the administrator removes their profile picture.
 */
export async function removeAvatarFiles(userId: string): Promise<boolean> {
  if (!userId) return false;

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(AVATAR_BUCKET)
    .list(userId, { limit: 50 });

  if (error) {
    console.error("تعذّر قراءة ملفات الصورة الشخصية:", error.message);
    return false;
  }

  const paths = (data ?? [])
    .filter((entry) => Boolean(entry.id))
    .map((entry) => `${userId}/${entry.name}`);

  if (paths.length === 0) return true;

  const { error: removeError } = await admin.storage
    .from(AVATAR_BUCKET)
    .remove(paths);

  if (removeError) {
    console.error("تعذّر حذف الصورة الشخصية:", removeError.message);
    return false;
  }

  return true;
}

/**
 * Maps the authenticated session into the serialisable view model used by the
 * profile page.
 *
 * The role is always read from the server-side `profiles` row — never from a
 * client-provided value.
 */
export function toProfileView(
  session: SessionContext,
  avatarUrl: string | null,
): ProfileView {
  const { profile, user, role } = session;

  return {
    id: user.id,
    email: user.email ?? profile.email ?? null,
    fullName: profile.full_name ?? null,
    phoneNumber: profile.phone_number ?? null,
    role,
    address: profile.address ?? null,
    deliveryRating: profile.delivery_rating ?? null,
    numberRatings: profile.number_ratings ?? null,
    updatedAt: profile.updated_at ?? null,
    createdAt: user.created_at ?? null,
    avatarUrl,
  };
}
