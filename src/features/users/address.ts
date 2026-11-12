import type { Json } from "@/types/database.types";

/**
 * Berlin Food — Users address helpers.
 *
 * `profiles.address` is a `jsonb` column whose shape drifted over time.
 * Observed shapes in the wild:
 *
 * - `"حي بربيح ، مسكن 940 ، رقم 12"` — a plain Arabic string
 * - `{ lat, lng }` — a geo point
 * - `{ lat, lng, label, formatted }` — a geo point with a readable label
 * - `{ zip, city, street }` — a structured postal address
 *
 * The helpers below normalise every shape into a short, honest label for the
 * table and into Arabic key/value pairs for the detail page.
 */

/** Arabic labels for the known address keys. */
export const USER_ADDRESS_LABELS: Record<string, string> = {
  label: "العنوان",
  formatted: "العنوان الكامل",
  city: "المدينة",
  street: "الشارع",
  zip: "الرمز البريدي",
  lat: "خط العرض",
  lng: "خط الطول",
  latitude: "خط العرض",
  longitude: "خط الطول",
};

/** The label used when only coordinates are known. */
export const GENERIC_LOCATION_LABEL = "موقع محدد";

export type AddressEntry = {
  label: string;
  value: string;
};

function asRecord(value: Json | null | undefined): Record<string, Json> | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, Json>;
}

function asText(value: Json | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

/**
 * Derives a short, human readable label for the address column of the table.
 *
 * The precedence never invents data: an unknown shape becomes an em dash
 * instead of a fabricated place name.
 */
export function summarizeUserAddress(value: Json | null | undefined): string {
  if (value === null || value === undefined) return "—";

  if (typeof value === "string") {
    const text = value.trim();
    return text || "—";
  }

  const record = asRecord(value);
  if (!record) return "—";

  const label = asText(record.label);
  if (label) return label;

  const street = asText(record.street);
  const city = asText(record.city);
  if (street && city) return `${street}، ${city}`;
  if (city) return city;

  const formatted = asText(record.formatted);
  if (formatted) return formatted;

  const lat = asText(record.lat ?? record.latitude);
  const lng = asText(record.lng ?? record.longitude);
  if (lat || lng) return GENERIC_LOCATION_LABEL;

  return "—";
}

/**
 * Renders the stored address as a list of Arabic-labelled entries — used by
 * the «العنوان» section of the detail page.
 */
export function describeUserAddress(
  value: Json | null | undefined,
): AddressEntry[] {
  if (value === null || value === undefined) return [];

  if (typeof value === "string") {
    const text = value.trim();
    return text ? [{ label: USER_ADDRESS_LABELS.label, value: text }] : [];
  }

  const record = asRecord(value);
  if (!record) return [];

  const entries: AddressEntry[] = [];

  const label = asText(record.label);
  const formatted = asText(record.formatted);

  if (label) entries.push({ label: USER_ADDRESS_LABELS.label, value: label });
  if (formatted && formatted !== label) {
    entries.push({ label: USER_ADDRESS_LABELS.formatted, value: formatted });
  }

  for (const key of ["city", "street", "zip"] as const) {
    const entry = asText(record[key]);
    if (entry) entries.push({ label: USER_ADDRESS_LABELS[key], value: entry });
  }

  const lat = asText(record.lat ?? record.latitude);
  const lng = asText(record.lng ?? record.longitude);
  if (lat || lng) {
    entries.push({
      label: "الموقع",
      value: lat && lng ? `${lat}, ${lng}` : (lat || lng),
    });
  }

  if (entries.length === 0) {
    for (const [key, entry] of Object.entries(record)) {
      const text = asText(entry);
      if (!text) continue;
      entries.push({
        label: USER_ADDRESS_LABELS[key] ?? key,
        value: text,
      });
    }
  }

  return entries;
}

/**
 * Converts the free-text address of the forms back into the jsonb shape that
 * the platform stores (`{ label }`).
 */
export function serializeUserAddress(value: string | null | undefined): Json | null {
  const text = (value ?? "").trim();
  if (!text) return null;
  return { label: text };
}
