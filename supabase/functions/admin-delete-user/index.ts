/**
 * Berlin Food — admin-delete-user Edge Function.
 *
 * Deletes a platform account permanently. The `profiles` row is removed by the
 * foreign-key cascade, so deleting the auth user is enough.
 *
 * Security:
 * - the caller is verified through their JWT (`verifyCaller`);
 * - either `users.delete` or `admins.manage` is required — both are held by
 *   the `superadmin` only;
 * - a superadmin cannot delete their own account (it would end the session of
 *   the very person performing the action);
 * - the delete uses the service-role client.
 */

import { createAdminClient, verifyCaller } from "../_shared/auth.ts";
import { handleCorsPreflight } from "../_shared/cors.ts";
import {
  handleError,
  jsonResponse,
  methodNotAllowed,
  readJsonBody,
} from "../_shared/http.ts";
import { PERMISSION_DENIAL_MESSAGES } from "../_shared/permissions.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The Arabic message returned when a superadmin tries to delete themself. */
const SELF_DELETE_ERROR = "لا يمكنك حذف حسابك الحالي.";

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") ?? undefined;

  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  if (request.method !== "POST") {
    return methodNotAllowed(origin);
  }

  try {
    const session = await verifyCaller(request);

    const canDelete =
      session.permissions.has("users.delete") ||
      session.permissions.has("admins.manage");

    if (!canDelete) {
      return jsonResponse(
        {
          ok: false,
          error: PERMISSION_DENIAL_MESSAGES["users.delete"],
        },
        403,
        origin,
      );
    }

    const body = await readJsonBody(request);
    if (!body) {
      return jsonResponse({ ok: false, error: "الحساب غير موجود." }, 200, origin);
    }

    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id || !UUID_PATTERN.test(id)) {
      return jsonResponse({ ok: false, error: "الحساب غير موجود." }, 200, origin);
    }

    if (session.user.id === id) {
      return jsonResponse({ ok: false, error: SELF_DELETE_ERROR }, 200, origin);
    }

    const admin = createAdminClient();

    const { error: deleteError } = await admin.auth.admin.deleteUser(id);

    if (deleteError) {
      const message = deleteError.message ?? "";
      const notFound = /User not found/i.test(message);

      if (!notFound) {
        console.error("تعذّر حذف الحساب:", deleteError);
      }

      return jsonResponse(
        {
          ok: false,
          error: notFound
            ? "الحساب غير موجود."
            : "تعذّر حفظ التغييرات. حاول مرة أخرى.",
        },
        200,
        origin,
      );
    }

    return jsonResponse(
      { ok: true, message: "تم حذف الحساب بنجاح" },
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
