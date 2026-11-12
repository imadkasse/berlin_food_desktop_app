import {
  DELIVERY_STATUSES,
  type DeliveryRequestStatus,
} from "@/types/app";
import type {
  DeliveryPeriodFilter,
  DeliveryRequestFilters,
  DeliveryStatusFilter,
} from "@/features/deliveries/types";

/* -------------------------------------------------------------------------- */
/*                              Request validation                            */
/* -------------------------------------------------------------------------- */

export type DeliveryRequestInput = {
  fullName: string;
  phoneNumber: string;
  email?: string | null;
};

export type DeliveryRequestFieldErrors = Partial<
  Record<"fullName" | "phoneNumber" | "email", string>
>;

export type DeliveryRequestValidation =
  | {
      ok: true;
      data: { fullName: string; phoneNumber: string; email: string | null };
    }
  | { ok: false; errors: DeliveryRequestFieldErrors };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PHONE_DIGITS = 6;
const MAX_PHONE_DIGITS = 15;

/**
 * Validates the «طلب توصيل جديد» form.
 *
 * All messages are Arabic and describe the concrete problem, so the admin can
 * fix the field without guessing.
 */
export function validateDeliveryRequestInput(
  input: DeliveryRequestInput,
): DeliveryRequestValidation {
  const errors: DeliveryRequestFieldErrors = {};

  const fullName = (input.fullName ?? "").trim();
  if (!fullName) {
    errors.fullName = "الاسم الكامل مطلوب.";
  } else if (fullName.length < 3) {
    errors.fullName = "الاسم الكامل يجب ألا يقل عن 3 أحرف.";
  } else if (fullName.length > 120) {
    errors.fullName = "الاسم الكامل طويل جدًا (الحد الأقصى 120 حرفًا).";
  }

  const phoneNumber = (input.phoneNumber ?? "").trim();
  const phoneDigits = phoneNumber.replace(/\D/g, "");
  if (!phoneNumber) {
    errors.phoneNumber = "رقم الهاتف مطلوب.";
  } else if (
    phoneDigits.length < MIN_PHONE_DIGITS ||
    phoneDigits.length > MAX_PHONE_DIGITS
  ) {
    errors.phoneNumber =
      "رقم الهاتف غير صالح — أدخل رقمًا يتكوّن من 6 إلى 15 رقمًا.";
  }

  const email = (input.email ?? "").trim();
  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = "البريد الإلكتروني غير صالح.";
  }

  if (errors.fullName || errors.phoneNumber || errors.email) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      fullName,
      phoneNumber,
      email: email || null,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                                Status guards                               */
/* -------------------------------------------------------------------------- */

/** `true` when `value` is one of the three `delivery_status` enum values. */
export function isDeliveryStatus(
  value: unknown,
): value is DeliveryRequestStatus {
  return (
    typeof value === "string" &&
    (DELIVERY_STATUSES as readonly string[]).includes(value)
  );
}

/* -------------------------------------------------------------------------- */
/*                              Filter parsing                                */
/* -------------------------------------------------------------------------- */

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/**
 * Normalises the raw URL search parameters of the page into the filter state
 * used by the data layer. Unknown or malformed values fall back to «الكل».
 */
export function parseDeliveryFilters(
  params: Record<string, string | string[] | undefined>,
  pageSize = 10,
): DeliveryRequestFilters {
  const q = firstValue(params.q).trim().slice(0, 120);

  const statusRaw = firstValue(params.status);
  const status: DeliveryStatusFilter =
    statusRaw && isDeliveryStatus(statusRaw) ? statusRaw : "all";

  const periodRaw = firstValue(params.period);
  const period: DeliveryPeriodFilter = (
    ["all", "today", "7d", "30d"] as const
  ).includes(periodRaw as DeliveryPeriodFilter)
    ? (periodRaw as DeliveryPeriodFilter)
    : "all";

  const pageRaw = Number.parseInt(firstValue(params.page), 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return { q, status, period, page, pageSize };
}
