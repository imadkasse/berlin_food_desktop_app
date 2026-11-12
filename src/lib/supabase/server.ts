import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database.types";

/**
 * Request-bound server Supabase client.
 *
 * Reads and writes the session through the Next.js cookie store so that
 * Server Components, Server Actions and Route Handlers share one session.
 */
export async function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "متغيرات البيئة غير مكتملة: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
    );
  }

  const cookieStore = await cookies();

  return createSSRServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // `setAll` was called from a Server Component — this is safe to
          // ignore because `src/proxy.ts` refreshes the session on every
          // matched request and writes the refreshed cookies back.
        }
      },
    },
  });
}

export type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>;
