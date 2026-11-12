import {
  ROLES,
  type Role,
} from "@/lib/auth/permissions";
import {
  USER_SORT_LABELS,
  USER_STATUS_LABELS,
  USER_TABS,
  USER_TAB_LABELS,
  type UserFilters,
  type UserSort,
  type UserStatusFilter,
  type UserTab,
} from "@/features/users/types";

/* -------------------------------------------------------------------------- */
/*                              Create-user input                             */
/* -------------------------------------------------------------------------- */

export type CreateUserInput = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: Role;
  vehicleType?: string | null;
  address?: string | null;
};

export type CreateUserFieldErrors = Partial<
  Record<
    | "fullName"
    | "email"
    | "phoneNumber"
    | "password"
    | "role"
    | "vehicleType"
    | "address",
    string
  >
>;

export type CreateUserValidation =
  | {
      ok: true;
      data: {
        fullName: string;
        email: string;
        phoneNumber: string;
        password: string;
        role: Role;
        vehicleType: string | null;
        address: string | null;
      };
    }
  | { ok: false; errors: CreateUserFieldErrors };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PHONE_DIGITS = 6;
const MAX_PHONE_DIGITS = 15;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Validates the «إضافة مستخدم» form.
 *
 * All messages are Arabic and describe the concrete problem, so the admin can
 * fix the field without guessing.
 */
export function validateCreateUserInput(
  input: Partial<CreateUserInput>,
): CreateUserValidation {
  const errors: CreateUserFieldErrors = {};

  const fullName = (input.fullName ?? "").trim();
  if (!fullName) {
    errors.fullName = "الاسم الكامل مطلوب.";
  } else if (fullName.length < 3) {
    errors.fullName = "الاسم الكامل يجب ألا يقل عن 3 أحرف.";
  } else if (fullName.length > 120) {
    errors.fullName = "الاسم الكامل طويل جدًا (الحد الأقصى 120 حرفًا).";
  }

  const email = (input.email ?? "").trim().toLowerCase();
  if (!email) {
    errors.email = "البريد الإلكتروني مطلوب.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "البريد الإلكتروني غير صالح.";
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

  const password = input.password ?? "";
  if (!password) {
    errors.password = "كلمة المرور مطلوبة.";
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `كلمة المرور يجب ألا تقل عن ${MIN_PASSWORD_LENGTH} أحرف.`;
  }

  const role = input.role;
  if (!role || !(ROLES as readonly string[]).includes(role)) {
    errors.role = "الدور مطلوب.";
  }

  const vehicleType = (input.vehicleType ?? "").trim() || null;

  if (errors.fullName || errors.email || errors.phoneNumber || errors.password || errors.role) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      fullName,
      email,
      phoneNumber,
      password,
      role: role as Role,
      vehicleType,
      address: (input.address ?? "").trim() || null,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                              Edit-user input                               */
/* -------------------------------------------------------------------------- */

export type UpdateUserInput = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  vehicleType?: string | null;
  availabilityStatus?: boolean | null;
  address?: string | null;
};

export type UpdateUserFieldErrors = Partial<
  Record<"fullName" | "email" | "phoneNumber" | "vehicleType" | "address", string>
>;

export type UpdateUserValidation =
  | {
      ok: true;
      data: {
        id: string;
        fullName: string;
        email: string;
        phoneNumber: string;
        vehicleType: string | null;
        availabilityStatus: boolean | null;
        address: string | null;
      };
    }
  | { ok: false; errors: UpdateUserFieldErrors };

/** Validates the «تعديل البيانات» form. */
export function validateUpdateUserInput(
  input: Partial<UpdateUserInput>,
): UpdateUserValidation {
  const errors: UpdateUserFieldErrors = {};

  const id = (input.id ?? "").trim();
  if (!id) {
    return { ok: false, errors: { fullName: "الحساب غير موجود." } };
  }

  const fullName = (input.fullName ?? "").trim();
  if (!fullName) {
    errors.fullName = "الاسم الكامل مطلوب.";
  } else if (fullName.length < 3) {
    errors.fullName = "الاسم الكامل يجب ألا يقل عن 3 أحرف.";
  } else if (fullName.length > 120) {
    errors.fullName = "الاسم الكامل طويل جدًا (الحد الأقصى 120 حرفًا).";
  }

  const email = (input.email ?? "").trim().toLowerCase();
  if (!email) {
    errors.email = "البريد الإلكتروني مطلوب.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "البريد الإلكتروني غير صالح.";
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

  if (errors.fullName || errors.email || errors.phoneNumber) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      id,
      fullName,
      email,
      phoneNumber,
      vehicleType: (input.vehicleType ?? "").trim() || null,
      availabilityStatus: input.availabilityStatus ?? null,
      address: (input.address ?? "").trim() || null,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                                Role guards                                 */
/* -------------------------------------------------------------------------- */

/** `true` when `value` is one of the known platform roles. */
export function isRole(value: unknown): value is Role {
  return (
    typeof value === "string" && (ROLES as readonly string[]).includes(value)
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Id guard                                   */
/* -------------------------------------------------------------------------- */

/** The canonical shape of a `profiles.id` (an `auth.users.id`). */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `true` when the value can be a profile id.
 *
 * The guard exists because Postgres rejects a malformed uuid with a hard
 * error (`22P02`) — an invalid link must render the not-found state, not
 * crash the page.
 */
export function isUserId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

/* -------------------------------------------------------------------------- */
/*                              Filter parsing                                */
/* -------------------------------------------------------------------------- */

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/** `true` when the given tab is one of the four known tabs. */
export function isUserTab(value: unknown): value is UserTab {
  return (
    typeof value === "string" && (USER_TABS as readonly string[]).includes(value)
  );
}

/** `true` when the given status is one of the three known status filters. */
export function isUserStatusFilter(
  value: unknown,
): value is UserStatusFilter {
  return (
    typeof value === "string" &&
    (Object.keys(USER_STATUS_LABELS) as string[]).includes(value)
  );
}

/** `true` when the given sort is one of the three known sort orders. */
export function isUserSort(value: unknown): value is UserSort {
  return (
    typeof value === "string" &&
    (Object.keys(USER_SORT_LABELS) as string[]).includes(value)
  );
}

/**
 * Normalises the raw URL search parameters of the page into the filter state
 * used by the data layer. Unknown or malformed values fall back to «الكل».
 */
export function parseUserFilters(
  params: Record<string, string | string[] | undefined>,
  pageSize = 20,
): UserFilters {
  const q = firstValue(params.q).trim().slice(0, 120);

  const tabRaw = firstValue(params.tab);
  const tab: UserTab = isUserTab(tabRaw) ? tabRaw : "all";

  const statusRaw = firstValue(params.status);
  const status: UserStatusFilter = isUserStatusFilter(statusRaw)
    ? statusRaw
    : "all";

  const sortRaw = firstValue(params.sort);
  const sort: UserSort = isUserSort(sortRaw) ? sortRaw : "updated_desc";

  const pageRaw = Number.parseInt(firstValue(params.page), 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return { q, tab, status, sort, page, pageSize };
}

/** Arabic labels of the tab filter — re-exported for the client components. */
export { USER_TAB_LABELS, USER_STATUS_LABELS, USER_SORT_LABELS };
