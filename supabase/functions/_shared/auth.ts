/**
 * Berlin Food — Edge Function authentication helpers.
 *
 * Verifies the incoming caller via their Supabase JWT and loads the matching
 * platform profile. All enforcement uses the service-role client so the
 * caller cannot influence the outcome.
 */

import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

import type { Permission, Profile, Role } from "./types.ts";
import { permissionsForRole, toRole } from "./permissions.ts";
import { ForbiddenError, UnauthorizedError } from "./rbac.ts";

export type VerifiedSession = {
  user: User;
  profile: Profile;
  role: Role;
  permissions: Set<Permission>;
};

/** Creates a service-role Supabase client for Edge Function internals. */
export function createAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Verifies the caller of an Edge Function.
 *
 * Reads the `Authorization: Bearer <jwt>` header, validates the JWT against
 * Supabase Auth, and loads the matching `profiles` row. Returns the resolved
 * user, profile, normalised role, and computed permission set.
 *
 * Throws `UnauthorizedError` for missing/invalid JWT and `ForbiddenError`
 * when the profile or role cannot be resolved.
 */
export async function verifyCaller(request: Request): Promise<VerifiedSession> {
  const authorization = request.headers.get("Authorization");
  const jwt = authorization?.replace(/^Bearer\s+/i, "").trim();

  if (!jwt) {
    throw new UnauthorizedError();
  }

  const supabase = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(jwt);

  if (userError || !user) {
    throw new UnauthorizedError();
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select<string, Profile>("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("تعذّر تحميل ملف المستخدم:", profileError.message);
    throw new ForbiddenError("تعذّر التحقق من صلاحيات الحساب.");
  }

  if (!profile) {
    throw new ForbiddenError("لا يملك هذا الحساب صلاحية الوصول إلى لوحة الإدارة.");
  }

  const role = toRole(profile.role);

  if (!role) {
    throw new ForbiddenError("لا يملك هذا الحساب دورًا صالحًا للوصول.");
  }

  return {
    user,
    profile,
    role,
    permissions: permissionsForRole(role),
  };
}
