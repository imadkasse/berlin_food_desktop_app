/**
 * Berlin Food — verify-session Edge Function.
 *
 * Validates the caller's JWT and returns their profile, role, and computed
 * permissions. This is the foundation for client-side SDK migration:
 * the dashboard will call this function to hydrate the session instead of
 * relying on server components alone.
 */

import { verifyCaller } from "../_shared/auth.ts";
import { ForbiddenError, UnauthorizedError } from "../_shared/rbac.ts";
import { corsHeaders, handleCorsPreflight } from "../_shared/cors.ts";

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") ?? undefined;

  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "Method Not Allowed" }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(origin),
        },
      },
    );
  }

  try {
    const session = await verifyCaller(request);

    return new Response(
      JSON.stringify({
        ok: true,
        userId: session.user.id,
        role: session.role,
        permissions: Array.from(session.permissions),
        profile: session.profile,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(origin),
        },
      },
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "يجب تسجيل الدخول أولًا للمتابعة.",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(origin),
          },
        },
      );
    }

    if (error instanceof ForbiddenError) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: error.message,
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(origin),
          },
        },
      );
    }

    console.error("verify-session failed:", error);

    return new Response(
      JSON.stringify({
        ok: false,
        error: "تعذّر التحقق من الجلسة. حاول مرة أخرى.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(origin),
        },
      },
    );
  }
});
