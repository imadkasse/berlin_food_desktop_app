/**
 * Arabic-aware formatters.
 *
 * Digits policy: Latin (Western) digits are used for numbers, prices and IDs
 * (order IDs are UUIDs and the sibling apps render Latin digits), while dates
 * are formatted with the `ar` locale so the month/day names stay Arabic.
 */

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("ar", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("ar", {
  day: "numeric",
  month: "short",
});

const timeFormatter = new Intl.DateTimeFormat("ar", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Formats a number using Latin digits, e.g. `1,250`. */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return numberFormatter.format(value);
}

/** Formats a price using Latin digits, e.g. `1,250` or `99.5`. */
export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return numberFormatter.format(value);
}

/** Formats a whole number without decimals, e.g. `1,250`. */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return integerFormatter.format(value);
}

/** Formats a date, e.g. `11 نوفمبر 2026`. */
export function formatDate(value: Date | string | number | null | undefined): string {
  const date = toDate(value);
  if (!date) return "—";
  return dateFormatter.format(date);
}

/** Formats a short date, e.g. `11 نوفمبر`. */
export function formatShortDate(
  value: Date | string | number | null | undefined,
): string {
  const date = toDate(value);
  if (!date) return "—";
  return shortDateFormatter.format(date);
}

/** Formats a date and time, e.g. `11 نوفمبر 2026، 16:12`. */
export function formatDateTime(
  value: Date | string | number | null | undefined,
): string {
  const date = toDate(value);
  if (!date) return "—";
  return `${dateFormatter.format(date)}، ${timeFormatter.format(date)}`;
}

/** Formats only the time part, e.g. `16:12`. */
export function formatTime(value: Date | string | number | null | undefined): string {
  const date = toDate(value);
  if (!date) return "—";
  return timeFormatter.format(date);
}

const RELATIVE_UNITS: { limit: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { limit: 60, divisor: 1, unit: "second" },
  { limit: 3600, divisor: 60, unit: "minute" },
  { limit: 86400, divisor: 3600, unit: "hour" },
  { limit: 2592000, divisor: 86400, unit: "day" },
  { limit: 31536000, divisor: 2592000, unit: "month" },
];

const relativeFormatter = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });

/** Formats a relative time in Arabic, e.g. `قبل 5 دقائق`. */
export function formatRelativeTime(
  value: Date | string | number | null | undefined,
): string {
  const date = toDate(value);
  if (!date) return "—";

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 45) return "الآن";

  for (const { limit, divisor, unit } of RELATIVE_UNITS) {
    if (absSeconds < limit) {
      return relativeFormatter.format(Math.round(diffSeconds / divisor), unit);
    }
  }

  return relativeFormatter.format(Math.round(diffSeconds / 31536000), "year");
}

/**
 * Formats a phone number into readable groups without changing its digits.
 *
 * Groups are three digits wide; a trailing single digit is merged into the
 * previous group so no group is left dangling (e.g. `+49 176 12345678`).
 */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return "—";
  const trimmed = value.trim();
  if (!trimmed) return "—";

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return trimmed;

  const isInternational = trimmed.startsWith("+");

  const chunks: string[] = [];
  for (let index = 0; index < digits.length; index += 3) {
    chunks.push(digits.slice(index, index + 3));
  }

  if (chunks.length > 1 && chunks[chunks.length - 1].length === 1) {
    const last = chunks.pop() as string;
    chunks[chunks.length - 1] += last;
  }

  return `${isInternational ? "+" : ""}${chunks.join(" ")}`;
}

/** Formats a percentage, e.g. `87%`. */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${integerFormatter.format(value)}%`;
}

/** Truncates a UUID to a short, readable order id, e.g. `7C2B0F17`. */
export function shortId(value: string | null | undefined): string {
  if (!value) return "—";
  return value.replace(/-/g, "").slice(0, 8).toUpperCase();
}
