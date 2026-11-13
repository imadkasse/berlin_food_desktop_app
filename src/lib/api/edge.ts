import { createClient } from "@/lib/supabase/client";

export type EdgeActionResult = { ok: true; message: string } | { ok: false; error: string };

const GENERIC_ERROR = "تعذّر تنفيذ العملية. حاول مرة أخرى.";
const NETWORK_ERROR = "تعذّر الاتصال بالخادم. تحقق من شبكتك وحاول مرة أخرى.";
const AUTH_ERROR = "انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.";

/**
 * Invokes a Supabase Edge Function from the browser and normalises all failure
 * modes into a typed, Arabic-friendly result.
 */
export async function invokeEdge<T = EdgeActionResult>(
  functionName: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.functions.invoke<T>(functionName, {
      body,
    });

    if (error) {
      console.error(`Edge function "${functionName}" failed:`, error);
      throw error;
    }

    return data as T;
  } catch (error) {
    const message = toArabicError(error);

    return { ok: false, error: message } as T;
  }
}

/**
 * Turns any thrown error into an Arabic, user-facing message.
 *
 * Permission / authentication problems keep their dedicated wording while
 * anything unexpected is reported generically so that no technical detail
 * leaks into the UI.
 */
export function toArabicError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "PermissionError" || error.name === "UnauthorizedError") {
      return error.message;
    }

    if (
      error.name === "FunctionsFetchError" ||
      /fetch|network|failed to fetch/i.test(error.message)
    ) {
      return NETWORK_ERROR;
    }
  }

  if (isAuthError(error)) {
    return AUTH_ERROR;
  }

  console.error("Edge function error:", error);
  return GENERIC_ERROR;
}

/**
 * Translates Supabase auth errors into actionable Arabic messages.
 */
export function toAuthErrorMessage(error: unknown): string {
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

  if (/invalid login|invalid credentials|JWT expired|session/i.test(message)) {
    return AUTH_ERROR;
  }

  console.error("Auth error:", error);
  return "تعذّر إنشاء الحساب. حاول مرة أخرى.";
}

function isAuthError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  return (
    error.name === "AuthApiError" ||
    error.name === "AuthSessionMissingError" ||
    error.name === "AuthInvalidTokenPasswordError" ||
    /JWT expired|session|Not authenticated|Unauthorized/i.test(error.message)
  );
}
