/**
 * Berlin Food — Profile validation.
 *
 * Every rule is mirrored on the client (instant feedback) and on the server
 * (authoritative rejection). Messages are Arabic and state the outcome.
 */

/** Minimum length required by Supabase for a new password. */
export const MIN_PASSWORD_LENGTH = 8;

/** Maximum accepted length of the full name. */
export const MAX_NAME_LENGTH = 120;

/** Maximum accepted length of the phone number. */
export const MAX_PHONE_LENGTH = 20;

/** Accepts international and local formats: `+49 176 1234567`, `0176-1234567`. */
export const PHONE_PATTERN = /^\+?[0-9][0-9\s()-]{4,19}$/;

/** Hint shown under the new-password field. */
export const PASSWORD_HINT = `8 أحرف على الأقل`;

/** Validates the full name — returns an Arabic error message or `null`. */
export function validateFullName(value: string): string | null {
  const name = value.trim();
  if (!name) return "الاسم الكامل مطلوب.";
  if (name.length > MAX_NAME_LENGTH) {
    return `الاسم الكامل يجب ألا يتجاوز ${MAX_NAME_LENGTH} حرفًا.`;
  }
  return null;
}

/** Validates the phone number — returns an Arabic error message or `null`. */
export function validatePhone(value: string): string | null {
  const phone = value.trim();
  if (!phone) return null;
  if (phone.length > MAX_PHONE_LENGTH) {
    return "رقم الهاتف طويل جدًا.";
  }
  if (!PHONE_PATTERN.test(phone)) {
    return "رقم الهاتف غير صالح. مثال: +49 176 1234567";
  }
  return null;
}

/** Validates the *new* password against the current one. */
export function validateNewPassword(
  currentPassword: string,
  newPassword: string,
): string | null {
  if (!newPassword) return "كلمة المرور الجديدة مطلوبة.";
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return `كلمة المرور الجديدة يجب ألا تقل عن ${MIN_PASSWORD_LENGTH} أحرف.`;
  }
  if (newPassword === currentPassword) {
    return "كلمة المرور الجديدة يجب أن تختلف عن كلمة المرور الحالية.";
  }
  return null;
}

/** Validates the confirmation field against the new password. */
export function validatePasswordConfirmation(
  newPassword: string,
  confirmPassword: string,
): string | null {
  if (!confirmPassword) return "تأكيد كلمة المرور مطلوب.";
  if (newPassword !== confirmPassword) return "كلمتا المرور غير متطابقتين.";
  return null;
}

/** Validates the current password field. */
export function validateCurrentPassword(value: string): string | null {
  if (!value) return "كلمة المرور الحالية مطلوبة.";
  return null;
}
