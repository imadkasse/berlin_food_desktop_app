/**
 * Berlin Food — admin-set-role Edge Function.
 *
 * Changes the role of an existing account.
 *
 * Security:
 * - the caller is verified through their JWT (`verifyCaller`);
 * - `roles.manage` is required — only a `superadmin` may change roles;
 * - `assertCanCreateRole` applies the same matrix as account creation;
 * - a superadmin cannot demote their own account (it would lock the platform
 *   out of the superadmin tier);
 * - the write uses the service-role client, because `authenticated` has no
 *   column-level grant on `profiles.role`.
 */

import { createAdminClient, verifyCaller } from "../_shared/auth.ts";
import { handleCorsPreflight } from "../_shared/cors.ts";
import {
  handleError,
  jsonResponse,
  methodNotAllowed,
  readJsonBody,
} from "../_shared/http.ts";
import { assertCanCreateRole, assertPermission } from "../_shared/rbac.ts";
import { ROLES, type Role } from "../_shared/types.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The Arabic message returned when a superadmin tries to demote themself. */
const SELF_ROLE_CHANGE_ERROR = "لا يمكنك تغيير دورك الحالي.";

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") ?? undefined;

  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  if (request.method !== "POST") {
    return methodNotAllowed(origin);
  }

  try {
    const session = await verifyCaller(request);
    assertPermission(session, "roles.manage");

    const body = await readJsonBody(request);
    if (!body) {
      return jsonResponse({ ok: false, error: "بيانات الحساب غير صالحة." }, 200, origin);
    }

    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id || !UUID_PATTERN.test(id)) {
      return jsonResponse({ ok: false, error: "الحساب غير موجود." }, 200, origin);
    }

    const role = body.role;
    if (typeof role !== "string" || !(ROLES as readonly string[]).includes(role)) {
      return jsonResponse({ ok: false, error: "الدور غير صالح." }, 200, origin);
    }

    // The RBAC gate — the target role is validated against the actor's role.
    assertCanCreateRole(session, role as Role);

    if (session.user.id === id && role !== "superadmin") {
      return jsonResponse({ ok: false, error: SELF_ROLE_CHANGE_ERROR }, 200, origin);
    }

    const admin = createAdminClient();

    const { error: updateError } = await admin
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      console.error("تعذّر تغيير دور الحساب:", updateError);
      return jsonResponse(
        { ok: false, error: "تعذّر حفظ التغييرات. حاول مرة أخرى." },
        200,
        origin,
      );
    }

    return jsonResponse(
      { ok: true, message: "تم تغيير دور الحساب بنجاح" },
      200,
      origin,
    );
  } catch (error) {
    return handleError(
      error,
      "تعذّر حفظ التغييرات. حاول مرة أخرى.",
      origin,
    );
  }
});
