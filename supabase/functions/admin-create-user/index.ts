/**
 * Berlin Food — admin-create-user Edge Function.
 *
 * Creates a platform account (auth user + `profiles` row) on behalf of an
 * authenticated administrator.
 *
 * Security:
 * - the caller is verified through their JWT (`verifyCaller`);
 * - `users.write` is required;
 * - `assertCanCreateRole` applies the RBAC matrix: an `admin` may only create
 *   `customer` / `delivery` accounts, a `superadmin` may create every role;
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

/* -------------------------------------------------------------------------- */
/*                                Validation                                  */
/* -------------------------------------------------------------------------- */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PHONE_DIGITS = 6;
const MAX_PHONE_DIGITS = 15;
const MIN_PASSWORD_LENGTH = 8;

type CreateUserData = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: Role;
  vehicleType: string | null;
  address: string | null;
};

type CreateUserValidation =
  | { ok: true; data: CreateUserData }
  | { ok: false; error: string };

/** Validates the `admin-create-user` payload — Arabic messages only. */
function validateCreateUserInput(
  input: Record<string, unknown>,
): CreateUserValidation {
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

  const password = typeof input.password === "string" ? input.password : "";
  if (!password) {
    return { ok: false, error: "كلمة المرور مطلوبة." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `كلمة المرور يجب ألا تقل عن ${MIN_PASSWORD_LENGTH} أحرف.`,
    };
  }

  const role = input.role;
  if (!role) {
    return { ok: false, error: "الدور مطلوب." };
  }
  if (typeof role !== "string" || !(ROLES as readonly string[]).includes(role)) {
    return { ok: false, error: "الدور غير صالح." };
  }

  return {
    ok: true,
    data: {
      fullName,
      email,
      phoneNumber,
      password,
      role: role as Role,
      vehicleType:
        typeof input.vehicleType === "string"
          ? input.vehicleType.trim() || null
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

  console.error("تعذّر إنشاء الحساب:", error);

  return "تعذّر إنشاء الحساب. حاول مرة أخرى.";
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

    const validation = validateCreateUserInput(body);
    if (!validation.ok) {
      return jsonResponse({ ok: false, error: validation.error }, 200, origin);
    }

    const input = validation.data;

    // The RBAC gate — the target role is checked against the actor's role.
    assertCanCreateRole(session, input.role);

    const admin = createAdminClient();

    const isCourier = input.role === "delivery";
    const vehicleType = isCourier ? (input.vehicleType ?? "motorcycle") : null;
    const availabilityStatus = isCourier ? true : null;
    const address = input.address ? { label: input.address } : null;

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: {
          full_name: input.fullName,
          phone_number: input.phoneNumber,
          role: input.role,
          vehicle_type: vehicleType,
          availability_status: availabilityStatus,
          address,
        },
      });

    if (createError) {
      return jsonResponse(
        { ok: false, error: toAuthErrorMessage(createError) },
        200,
        origin,
      );
    }

    if (!created.user) {
      return jsonResponse(
        {
          ok: false,
          error: "تعذّر إنشاء الحساب: بيانات المستخدم غير مكتملة.",
        },
        200,
        origin,
      );
    }

    // The trigger already created the row; this update makes the role and the
    // e-mail explicit instead of relying on the trigger's defaults.
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        full_name: input.fullName,
        phone_number: input.phoneNumber,
        email: input.email,
        role: input.role,
        vehicle_type: vehicleType,
        availability_status: availabilityStatus,
        address,
        updated_at: new Date().toISOString(),
      })
      .eq("id", created.user.id);

    if (updateError) {
      console.error("تعذّر تحديث ملف المستخدم بعد الإنشاء:", updateError);
      return jsonResponse(
        { ok: false, error: "تعذّر إنشاء الحساب. حاول مرة أخرى." },
        200,
        origin,
      );
    }

    return jsonResponse(
      { ok: true, message: "تم إنشاء الحساب بنجاح" },
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
