"use client";

import { useCallback, useEffect, useState } from "react";

import { toRole } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/client";
import type { ProfileView } from "@/features/profile/types";

/** Public storage bucket that holds profile pictures. */
const AVATAR_BUCKET = "avatars";

/** File name stem (without extension) used for every profile picture. */
const AVATAR_FILE_STEM = "avatar";

export type UseProfileViewResult = {
  profile: ProfileView | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

function isAuthSessionMissing(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AuthSessionMissingError" ||
      /session|JWT expired|Not authenticated/i.test(error.message))
  );
}

/**
 * Loads the signed-in administrator's profile from the browser Supabase SDK.
 *
 * The avatar public URL is derived by listing the user's own folder in the
 * `avatars` bucket — there is no `avatar_url` column on `profiles`.
 */
export function useProfileView(): UseProfileViewResult {
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        const message = isAuthSessionMissing(userError)
          ? "انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى."
          : "تعذّر تحميل الملف الشخصي. حاول مرة أخرى.";
        setError(message);
        setProfile(null);
        return;
      }

      const { data: row, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        // A missing profile row (PGRST116 / no rows) is tolerated: the user is
        // authenticated but simply has no platform role yet.
        if (profileError.code !== "PGRST116") {
          console.error("تعذّر تحميل الملف الشخصي:", profileError.message);
          setError("تعذّر تحميل الملف الشخصي. حاول مرة أخرى.");
          setProfile(null);
          return;
        }
      }

      let avatarUrl: string | null = null;
      try {
        const { data: files, error: listError } = await supabase.storage
          .from(AVATAR_BUCKET)
          .list(user.id, { limit: 50 });

        if (!listError && files) {
          const file = files.find(
            (entry) =>
              Boolean(entry.id) &&
              entry.name.startsWith(`${AVATAR_FILE_STEM}.`),
          );

          if (file) {
            const { data } = supabase.storage
              .from(AVATAR_BUCKET)
              .getPublicUrl(`${user.id}/${file.name}`);
            avatarUrl = data?.publicUrl ?? null;
          }
        }
      } catch (avatarError) {
        console.error("تعذّر قراءة الصورة الشخصية:", avatarError);
      }

      const profileRow = row ?? {
        id: user.id,
        full_name: null,
        phone_number: null,
        address: null,
        role: null,
        vehicle_type: null,
        availability_status: null,
        delivery_rating: null,
        number_ratings: null,
        updated_at: null,
        email: null,
      };

      setProfile({
        id: user.id,
        email: user.email ?? profileRow.email ?? null,
        fullName: profileRow.full_name ?? null,
        phoneNumber: profileRow.phone_number ?? null,
        role: toRole(profileRow.role ?? null),
        address: profileRow.address ?? null,
        deliveryRating: profileRow.delivery_rating ?? null,
        numberRatings: profileRow.number_ratings ?? null,
        updatedAt: profileRow.updated_at ?? null,
        createdAt: user.created_at ?? null,
        avatarUrl,
      });
    } catch (err) {
      console.error("تعذّر تحميل الملف الشخصي:", err);
      setError("تعذّر تحميل الملف الشخصي. حاول مرة أخرى.");
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return { profile, isLoading, error, refetch: fetchProfile };
}
