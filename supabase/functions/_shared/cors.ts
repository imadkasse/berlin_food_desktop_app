/**
 * Berlin Food — Edge Function CORS helpers.
 *
 * Allows the Supabase project URL, local Next.js/Tauri dev origins, and the
 * Tauri production origin.
 */

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:1420",
  "https://localhost:1420",
  "tauri://localhost",
];

/** Builds the set of allowed origins including the Supabase project URL. */
function allowedOrigins(): string[] {
  const projectUrl = Deno.env.get("SUPABASE_URL");
  const origins = [...DEFAULT_ALLOWED_ORIGINS];
  if (projectUrl) {
    try {
      const url = new URL(projectUrl);
      origins.push(`${url.protocol}//${url.host}`);
    } catch {
      // Ignore malformed project URL.
    }
  }
  return origins;
}

/** Returns true when `origin` is allowed to call the Edge Functions. */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return allowedOrigins().includes(origin);
}

/** Builds CORS headers for a response. */
export function corsHeaders(origin?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PATCH, DELETE",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };

  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

/**
 * Responds to an OPTIONS preflight request, or returns `null` when the request
 * is not a preflight.
 */
export function handleCorsPreflight(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;

  const origin = request.headers.get("origin");

  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin ?? undefined),
  });
}
