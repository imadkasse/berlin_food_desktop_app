import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import {
  type Permission,
  type Role,
  permissionsForRole,
  toRole,
} from "@/lib/auth/permissions";
import { createServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/app";

export type SessionContext = {
  /** The authenticated Supabase auth user. */
  user: User;
  /** The matching `public.profiles` row. */
  profile: ProfileRow;
  /** The normalised role of the profile (`null` when unknown/missing). */
  role: Role | null;
  /** The full set of permissions granted to {@link SessionContext.role}. */
  permissions: ReadonlySet<Permission>;
};

/**
 * Reads the current session without redirecting.
 *
 * Returns `null` when there is no authenticated user or when the profile row
 * cannot be loaded. Never throws for a missing profile.
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    // A missing profile row (PGRST116 / no rows) is tolerated: the user is
    // authenticated but simply has no platform role yet.
    if (profileError.code !== "PGRST116") {
      console.error("تعذّر تحميل ملف المستخدم:", profileError.message);
    }
  }

  const role = toRole(profile?.role ?? null);

  return {
    user,
    profile: (profile ?? {
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
    }) as ProfileRow,
    role,
    permissions: permissionsForRole(role),
  };
}

/**
 * Requires an authenticated session; redirects to `/login` when missing.
 */
export async function requireSession(): Promise<SessionContext> {
  const session = await getSessionContext();
  if (!session) {
    redirect("/login");
  }
  return session;
}
