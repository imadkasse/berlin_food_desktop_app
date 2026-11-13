import type { Json } from "@/types/database.types";
import type {
  OrderCustomerInfo,
  OrderItemInfo,
  OrderPeriodFilter,
} from "@/features/orders/types";

/* -------------------------------------------------------------------------- */
/*                                Order reference                             */
/* -------------------------------------------------------------------------- */

/**
 * Builds the short, human-readable order reference shown in the UI.
 *
 * The reference is the first six characters of the raw UUID, upper-cased —
 * e.g. `2f97c771-…` becomes `#2F97C7`. The full UUID stays available in the
 * `title` attribute and through the copy button.
 */
export function orderReference(id: string | null | undefined): string {
  if (!id) return "—";
  return `#${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

/* -------------------------------------------------------------------------- */
/*                              JSON column parsing                           */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/**
 * Parses the `customer` json column of the `order_info` view.
 *
 * The column is untyped JSON, so every field is validated before it reaches
 * the UI — a malformed row must never crash the table.
 */
export function parseOrderCustomer(value: Json | null): OrderCustomerInfo {
  if (!isRecord(value)) {
    return {
      id: null,
      fullName: null,
      email: null,
      phoneNumber: null,
      address: null,
    };
  }

  return {
    id: readString(value.id),
    fullName: readString(value.full_name),
    email: readString(value.email),
    phoneNumber: readString(value.phone_number),
    address: (value.address ?? null) as Json | null,
  };
}

/**
 * Parses the `items` json column of the `order_info` view.
 *
 * Each entry carries the quantity, the **unit-price snapshot** taken when the
 * order was placed and the menu item it refers to.
 */
export function parseOrderItems(value: Json | null): OrderItemInfo[] {
  if (!Array.isArray(value)) return [];

  const items: OrderItemInfo[] = [];

  for (const entry of value) {
    if (!isRecord(entry)) continue;

    const menuItem = isRecord(entry.menu_item) ? entry.menu_item : null;

    items.push({
      id: readString(entry.id),
      quantity: readNumber(entry.quantity) ?? 0,
      unitPrice: readNumber(entry.price),
      name: menuItem ? readString(menuItem.name) : null,
      menuItemId: menuItem ? readString(menuItem.id) : null,
      imageUrl: menuItem ? readString(menuItem.image_url) : null,
      currentPrice: menuItem ? readNumber(menuItem.price) : null,
    });
  }

  return items;
}

/* -------------------------------------------------------------------------- */
/*                                  Addresses                                 */
/* -------------------------------------------------------------------------- */

/** The address shapes the platform can store inside `delivery_address`. */
export type ParsedAddress = {
  label: string | null;
  formatted: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
  lat: number | null;
  lng: number | null;
};

/** Reads the known address keys out of a json value. */
export function parseAddress(value: Json | null): ParsedAddress | null {
  if (typeof value === "string") {
    const text = value.trim();
    return text
      ? {
          label: text,
          formatted: text,
          street: null,
          city: null,
          zip: null,
          lat: null,
          lng: null,
        }
      : null;
  }

  if (!isRecord(value)) return null;

  const parsed: ParsedAddress = {
    label: readString(value.label),
    formatted: readString(value.formatted),
    street: readString(value.street),
    city: readString(value.city),
    zip: readString(value.zip),
    lat: readNumber(value.lat),
    lng: readNumber(value.lng),
  };

  const hasText =
    parsed.label !== null ||
    parsed.formatted !== null ||
    parsed.street !== null ||
    parsed.city !== null ||
    parsed.zip !== null;

  const hasCoordinates = parsed.lat !== null || parsed.lng !== null;

  return hasText || hasCoordinates ? parsed : null;
}

/** Formats a coordinate pair with at most six decimals. */
function formatCoordinate(value: number): string {
  return String(Number(value.toFixed(6)));
}

/**
 * Renders a delivery address for the admin.
 *
 * Textual parts win over coordinates: a readable address is always more
 * useful than a point on a map. When only coordinates exist the address is
 * rendered as «موقع محدد (34.662941, 3.240381)».
 */
export function formatAddress(value: Json | null): string | null {
  const parsed = parseAddress(value);
  if (!parsed) return null;

  if (parsed.formatted) return parsed.formatted;
  if (parsed.label) return parsed.label;

  const streetLine = [parsed.street, parsed.city].filter(Boolean).join("، ");
  if (streetLine) {
    return parsed.zip ? `${streetLine}، ${parsed.zip}` : streetLine;
  }

  if (parsed.lat !== null && parsed.lng !== null) {
    return `موقع محدد (${formatCoordinate(parsed.lat)}, ${formatCoordinate(parsed.lng)})`;
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/*                                 Item counts                                */
/* -------------------------------------------------------------------------- */

/** The total number of individual items (sum of the quantities). */
export function totalItemCount(items: OrderItemInfo[]): number {
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

/** The number of distinct line items. */
export function lineItemCount(items: OrderItemInfo[]): number {
  return items.length;
}

/**
 * Arabic pluralisation for the item count.
 *
 * Arabic distinguishes singular, dual, a "few" form (3–10) and a "many" form
 * (11+), so the count is rendered with the right noun every time.
 */
export function pluralizeItems(count: number): string {
  if (count <= 0) return "لا أصناف";
  if (count === 1) return "صنف واحد";
  if (count === 2) return "صنفان";
  if (count <= 10) return `${count} أصناف`;
  return `${count} صنفًا`;
}

/** Arabic pluralisation for the order count. */
export function pluralizeOrders(count: number): string {
  if (count <= 0) return "لا طلبات";
  if (count === 1) return "طلب واحد";
  if (count === 2) return "طلبان";
  if (count <= 10) return `${count} طلبات`;
  return `${count} طلبًا`;
}

/**
 * Builds the one-line preview of the ordered items.
 *
 * The first two names are shown; the rest are summarised so the cell never
 * grows beyond a single line.
 */
export function itemsPreview(items: OrderItemInfo[]): string {
  const names = items
    .map((item) => item.name)
    .filter((name): name is string => Boolean(name));

  if (names.length === 0) return "بدون أصناف";

  if (names.length <= 2) return names.join("، ");

  return `${names.slice(0, 2).join("، ")} و${names.length - 2} أصناف أخرى`;
}

/* -------------------------------------------------------------------------- */
/*                              Server-side helpers                           */
/* -------------------------------------------------------------------------- */

/** Number of orders shown per page. */
export const ORDERS_PAGE_SIZE = 20;

/**
 * Removes the characters that would break a PostgREST filter expression.
 */
function sanitizeSearchTerm(raw: string): string {
  return raw
    .replace(/[,()"\\*%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * `true` when the term can only be a fragment of a UUID.
 */
function isUuidFragment(term: string): boolean {
  return (
    term.length >= 4 &&
    term.length <= 32 &&
    /^[0-9a-f]+$/.test(term) &&
    /[0-9]/.test(term)
  );
}

/** Formats a 32-character hex string back into the canonical UUID layout. */
function toUuid(hex: string): string {
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

/**
 * Builds the UUID range that covers every id starting with `prefix`.
 */
function uuidPrefixRange(prefix: string): { lo: string; hi: string } {
  const hex = prefix.toLowerCase();
  return {
    lo: toUuid(hex + "0".repeat(32 - hex.length)),
    hi: toUuid(hex + "f".repeat(32 - hex.length)),
  };
}

/**
 * Builds the PostgREST `or=(…)` expression for the free-text search.
 *
 * The returned string is the *inner* part of the expression.
 */
export function buildOrderSearchFilter(term: string): string | null {
  const sanitized = sanitizeSearchTerm(term);
  if (!sanitized) return null;

  const branches: string[] = [];

  const fragment = sanitized.replace(/[#\s-]/g, "");
  if (isUuidFragment(fragment)) {
    const { lo, hi } = uuidPrefixRange(fragment);
    branches.push(`and(id.gte.${lo},id.lt.${hi})`);
  }

  branches.push(`customer->>full_name.ilike.*${sanitized}*`);

  return branches.join(",");
}

/** The `created_at` cut-off for the «الفترة» filter, or `null` for «الكل». */
export function orderPeriodCutoff(
  period: OrderPeriodFilter,
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
