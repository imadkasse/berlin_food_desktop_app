import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

let browserClient: SupabaseClient<Database> | null = null;

/**
 * Browser-side Supabase client.
 *
 * Uses the *publishable* (anon) key only. The service-role key must never
 * reach the browser bundle.
 *
 * Sessions are persisted in `localStorage` rather than cookies because the
 * Tauri webview does not keep cookies across reloads.
 */
export function createClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "متغيرات البيئة غير مكتملة: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
    );
  }

  if (typeof window === "undefined") {
    return createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  if (!browserClient) {
    browserClient = createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        storage: window.localStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }

  return browserClient;
}

export type SupabaseBrowserClient = ReturnType<typeof createClient>;
