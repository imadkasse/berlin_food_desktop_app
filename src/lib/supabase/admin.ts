import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Server-only Supabase client that bypasses Row Level Security.
 *
 * SECURITY: the service-role key is a full-access secret. It must never be
 * exposed to the browser, so this module is marked `server-only` and refuses
 * to run in a client bundle.
 *
 * Every privileged operation MUST be preceded by a permission assertion
 * (`assertPermission` / `assertAnyPermission` / `assertCanCreateRole`) from
 * `src/lib/auth/guard.ts` — never trust a role coming from the client.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "عميل الخدمة (service-role) متاح على الخادم فقط ولا يجوز استخدامه في المتصفح.",
    );
  }

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "متغيرات البيئة غير مكتملة: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export type SupabaseAdminClient = ReturnType<typeof createAdminClient>;
