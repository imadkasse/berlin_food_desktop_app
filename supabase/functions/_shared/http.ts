/**
 * Berlin Food — Edge Function HTTP helpers.
 *
 * Keeps the request/response plumbing identical across the admin functions so
 * every endpoint answers with the same envelope:
 *
 * `{ ok: true, message } | { ok: false, error }`
 */

import { corsHeaders } from "./cors.ts";
import { ForbiddenError, UnauthorizedError } from "./rbac.ts";

/** Builds a JSON response with the caller's CORS headers. */
export function jsonResponse(
  payload: unknown,
  status: number,
  origin?: string,
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

/** The standard 405 response for non-POST calls. */
export function methodNotAllowed(origin?: string): Response {
  return jsonResponse({ ok: false, error: "Method Not Allowed" }, 405, origin);
}

/**
 * Reads the JSON body of a request.
 *
 * Returns `null` when the body is missing, malformed, or not an object, so the
 * caller can answer with a handled business error instead of throwing.
 */
export async function readJsonBody(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return null;
    }

    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Turns a thrown error into the matching response.
 *
 * - `UnauthorizedError` → 401
 * - `ForbiddenError` → 403
 * - anything else → 500 with the caller-provided Arabic message
 */
export function handleError(
  error: unknown,
  fallbackMessage: string,
  origin?: string,
): Response {
  if (error instanceof UnauthorizedError) {
    return jsonResponse({ ok: false, error: error.message }, 401, origin);
  }

  if (error instanceof ForbiddenError) {
    return jsonResponse({ ok: false, error: error.message }, 403, origin);
  }

  console.error(fallbackMessage, error);

  return jsonResponse({ ok: false, error: fallbackMessage }, 500, origin);
}
