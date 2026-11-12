import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database.types";

/**
 * Browser-side Supabase client.
 *
 * Uses the *publishable* (anon) key only. The service-role key must never
 * reach the browser bundle.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "متغيرات البيئة غير مكتملة: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}

export type SupabaseBrowserClient = ReturnType<typeof createClient>;
