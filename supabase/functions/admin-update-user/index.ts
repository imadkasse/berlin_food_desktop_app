/**
 * Berlin Food — admin-update-user Edge Function.
 *
 * Updates the editable fields of an account (name, e-mail, phone, vehicle,
 * availability, address). The `role` is deliberately **not** editable here —
 * a role change is a separate, more privileged operation
 * (`admin-set-role`).
 *
 * Security:
 * - the caller is verified through their JWT (`verifyCaller`);
 * - `users.write` is required;
 * - the target must sit strictly below the actor in the privilege ladder;
 * - the auth e-mail is kept in sync with `profiles.email`.
 */

import { createAdminClient, verifyCaller } from "../_shared/auth.ts";
import { handleCorsPreflight } from "../_shared/cors.ts";
import {
  handleError,
  jsonResponse,
  methodNotAllowed,
  readJsonBody,
} from "../_shared/http.ts";
import { assertPermission, checkTargetPrivilege } from "../_shared/rbac.ts";

/* -------------------------------------------------------------------------- */
/*                                Validation                                  */
/* -------------------------------------------------------------------------- */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PHONE_DIGITS = 6;
const MAX_PHONE_DIGITS = 15;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type UpdateUserData = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  vehicleType: string | null;
  availabilityStatus: boolean | null;
  address: string | null;
};

type UpdateUserValidation =
  | { ok: true; data: UpdateUserData }
  | { ok: false; error: string };

/** Validates the `admin-update-user` payload — Arabic messages only. */
function validateUpdateUserInput(
  input: Record<string, unknown>,
): UpdateUserValidation {
  const id = typeof input.id === "string" ? input.id.trim() : "";
  if (!id || !UUID_PATTERN.test(id)) {
    return { ok: false, error: "الحساب غير موجود." };
  }

  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  if (!fullName) {
    return { ok: false, error: "الاسم الكامل مطلوب." };
  }
  if (fullName.length < 3) {
    return { ok: false, error: "الاسم الكامل يجب ألا يقل عن 3 أحرف." };
  }
  if (fullName.length > 120) {
    return {
      ok: false,
      error: "الاسم الكامل طويل جدًا (الحد الأقصى 120 حرفًا).",
    };
  }

  const email =
    typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!email) {
    return { ok: false, error: "البريد الإلكتروني مطلوب." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "البريد الإلكتروني غير صالح." };
  }

  const phoneNumber =
    typeof input.phoneNumber === "string" ? input.phoneNumber.trim() : "";
  const phoneDigits = phoneNumber.replace(/\D/g, "");
  if (!phoneNumber) {
    return { ok: false, error: "رقم الهاتف مطلوب." };
  }
  if (
    phoneDigits.length < MIN_PHONE_DIGITS ||
    phoneDigits.length > MAX_PHONE_DIGITS
  ) {
    return {
      ok: false,
      error: "رقم الهاتف غير صالح — أدخل رقمًا يتكوّن من 6 إلى 15 رقمًا.",
    };
  }

  return {
    ok: true,
    data: {
      id,
      fullName,
      email,
      phoneNumber,
      vehicleType:
        typeof input.vehicleType === "string"
          ? input.vehicleType.trim() || null
          : null,
      availabilityStatus:
        typeof input.availabilityStatus === "boolean"
          ? input.availabilityStatus
          : null,
      address:
        typeof input.address === "string" ? input.address.trim() || null : null,
    },
  };
}

/** Translates Supabase auth errors into actionable Arabic messages. */
function toAuthErrorMessage(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : "";

  if (/already been registered|already registered|email_exists/i.test(message)) {
    return "هذا البريد الإلكتروني مسجّل مسبقًا في المنصة.";
  }

  if (/password should be at least/i.test(message)) {
    return "كلمة المرور قصيرة جدًا — يجب ألا تقل عن 8 أحرف.";
  }

  if (/email address invalid|email not valid/i.test(message)) {
    return "البريد الإلكتروني غير صالح.";
  }

  if (/User not found/i.test(message)) {
    return "الحساب غير موجود.";
  }

  console.error("تعذّر تحديث الحساب:", error);

  return "تعذّر حفظ التغييرات. حاول مرة أخرى.";
}

/* -------------------------------------------------------------------------- */
/*                                 Handler                                    */
/* -------------------------------------------------------------------------- */

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") ?? undefined;

  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  if (request.method !== "POST") {
    return methodNotAllowed(origin);
  }

  try {
    const session = await verifyCaller(request);
    assertPermission(session, "users.write");

    const body = await readJsonBody(request);
    if (!body) {
      return jsonResponse(
        { ok: false, error: "بيانات الحساب غير صالحة." },
        200,
        origin,
      );
    }

    const validation = validateUpdateUserInput(body);
    if (!validation.ok) {
      return jsonResponse({ ok: false, error: validation.error }, 200, origin);
    }

    const input = validation.data;
    const admin = createAdminClient();

    // The RBAC gate — the target role is read from the server-side profile.
    const privilege = await checkTargetPrivilege(
      admin,
      session.role,
      input.id,
    );

    if (!privilege.ok) {
      return jsonResponse({ ok: false, error: privilege.error }, 200, origin);
    }

    // `auth.users.email` is the login identity — it has to follow the new
    // address, otherwise the two e-mail columns drift apart.
    const { data: authUser, error: authError } =
      await admin.auth.admin.getUserById(input.id);

    if (authError) {
      return jsonResponse(
        { ok: false, error: toAuthErrorMessage(authError) },
        200,
        origin,
      );
    }

    const currentEmail = authUser.user?.email ?? null;

    if (currentEmail !== input.email) {
      const { error: emailError } = await admin.auth.admin.updateUserById(
        input.id,
        { email: input.email, email_confirm: true },
      );

      if (emailError) {
        return jsonResponse(
          { ok: false, error: toAuthErrorMessage(emailError) },
          200,
          origin,
        );
      }
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({
        full_name: input.fullName,
        phone_number: input.phoneNumber,
        email: input.email,
        vehicle_type: input.vehicleType,
        availability_status: input.availabilityStatus,
        address: input.address ? { label: input.address } : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id);

    if (updateError) {
      console.error("تعذّر تحديث ملف المستخدم:", updateError);
      return jsonResponse(
        { ok: false, error: "تعذّر حفظ التغييرات. حاول مرة أخرى." },
        200,
        origin,
      );
    }

    return jsonResponse(
      { ok: true, message: "تم حفظ التغييرات بنجاح" },
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
