/**
 * Berlin Food — admin-approve-delivery Edge Function.
 *
 * Approves a delivery request on behalf of an authenticated admin and, when
 * requested, promotes the associated customer account to `delivery`.
 *
 * Contract: POST only, JSON body `{ id: string, promoteCourier?: boolean }`,
 * `Authorization: Bearer <jwt>`.
 */

import { createAdminClient, verifyCaller } from "../_shared/auth.ts";
import {
  ForbiddenError,
  UnauthorizedError,
  assertCanCreateRole,
  assertPermission,
} from "../_shared/rbac.ts";
import { corsHeaders, handleCorsPreflight } from "../_shared/cors.ts";
import {
  fetchDeliveryRequestById,
  resolveCourierMatch,
  setProfileRole,
  updateDeliveryRequestStatus,
} from "../_shared/deliveries.ts";

/** Builds a JSON response with the CORS headers of the caller's origin. */
function json(
  status: number,
  body: unknown,
  origin?: string,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") ?? undefined;

  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  if (request.method !== "POST") {
    return json(405, { ok: false, error: "طريقة الطلب غير مدعومة." }, origin);
  }

  try {
    const session = await verifyCaller(request);
    assertPermission(session, "deliveries.write");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json(200, { ok: false, error: "بيانات الطلب غير صالحة." }, origin);
    }

    const payload = (body ?? {}) as {
      id?: unknown;
      promoteCourier?: unknown;
    };

    const id = typeof payload.id === "string" ? payload.id.trim() : "";

    if (!id) {
      return json(
        200,
        { ok: false, error: "معرّف طلب التوصيل غير صالح." },
        origin,
      );
    }

    const promoteCourier = payload.promoteCourier === true;

    const admin = createAdminClient();
    const deliveryRequest = await fetchDeliveryRequestById(admin, id);

    if (!deliveryRequest) {
      return json(200, { ok: false, error: "طلب التوصيل غير موجود." }, origin);
    }

    let promoted = false;

    if (promoteCourier) {
      const match = await resolveCourierMatch(admin, deliveryRequest);
      const target = match?.profile ?? null;

      if (target && target.role === "customer") {
        // Guard the privileged role change before touching the database.
        assertCanCreateRole(session, "delivery");
        await setProfileRole(admin, target.id, "delivery");
        promoted = true;
      }
      // A courier account needs no promotion, and a privileged account is
      // never converted — both cases are skipped silently.
    }

    await updateDeliveryRequestStatus(admin, id, "approved");

    return json(
      200,
      {
        ok: true,
        message: promoted
          ? "تم قبول الطلب وترقية الحساب إلى مندوب توصيل"
          : "تم قبول الطلب",
        promoted,
      },
      origin,
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return json(
        401,
        { ok: false, error: "يجب تسجيل الدخول أولًا للمتابعة." },
        origin,
      );
    }

    if (error instanceof ForbiddenError) {
      return json(403, { ok: false, error: error.message }, origin);
    }

    console.error("admin-approve-delivery failed:", error);

    return json(
      500,
      { ok: false, error: "تعذّر تنفيذ العملية. حاول مرة أخرى." },
      origin,
    );
  }
});
