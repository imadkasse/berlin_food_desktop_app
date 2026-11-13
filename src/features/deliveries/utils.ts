import type { DeliveryPeriodFilter } from "@/features/deliveries/types";

/* -------------------------------------------------------------------------- */
/*                                 Constants                                  */
/* -------------------------------------------------------------------------- */

/** Number of delivery requests shown per page. */
export const DELIVERY_PAGE_SIZE = 10;

/** Maximum number of delivery-history rows loaded for the detail panel. */
export const DELIVERY_HISTORY_LIMIT = 50;

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

/**
 * Removes the characters that would break a PostgREST `or=(...)` filter
 * expression. The wildcards `%` and `_` are kept on purpose — they are valid
 * `ilike` wildcards and simply widen the search.
 */
export function sanitizeSearchTerm(raw: string): string {
  return raw
    .replace(/[,()"\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalises a phone number to its digits only (used for fuzzy matching). */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** The `created_at` cut-off for the «الفترة» filter, or `null` for «الكل». */
export function deliveryPeriodCutoff(
  period: DeliveryPeriodFilter,
  now: Date = new Date(),
): Date | null {
  switch (period) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "all":
    default:
      return null;
  }
}

/**
 * Builds the PostgREST `or=(…)` expression for the free-text search of the
 * delivery-requests table: a case-insensitive `ilike` over the name, the
 * e-mail and the phone number.
 */
export function buildDeliverySearchFilter(term: string): string | null {
  const sanitized = sanitizeSearchTerm(term);
  if (!sanitized) return null;

  return [
    `full_name.ilike.%${sanitized}%`,
    `email.ilike.%${sanitized}%`,
    `phone_number.ilike.%${sanitized}%`,
  ].join(",");
}
