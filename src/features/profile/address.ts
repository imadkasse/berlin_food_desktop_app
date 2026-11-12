import type { Json } from "@/types/database.types";

/**
 * Berlin Food — Address helpers.
 *
 * `profiles.address` is a `jsonb` column whose shape drifted over time.
 * Observed shapes in the wild:
 *
 * - `"شارع ك.Take، برلين"` — a plain Arabic string
 * - `{ lat, lng }` — a geo point
 * - `{ label, formatted }` — a human readable label
 * - `{ zip, city, street }` — a structured postal address
 *
 * The helpers below normalise every shape into a form state that the profile
 * form can edit, and serialise it back without silently dropping data.
 */

/** Arabic labels for the known address keys. */
export const ADDRESS_FIELD_LABELS: Record<string, string> = {
  label: "العنوان",
  formatted: "العنوان الكامل",
  city: "المدينة",
  street: "الشارع",
  zip: "الرمز البريدي",
  lat: "خط العرض",
  lng: "خط الطول",
  longitude: "خط الطول",
  latitude: "خط العرض",
};

/** The structured keys the profile form is able to edit. */
export const EDITABLE_ADDRESS_KEYS = ["city", "street", "zip"] as const;

export type EditableAddressKey = (typeof EDITABLE_ADDRESS_KEYS)[number];

export type AddressFormState = {
  /**
   * `text`     → a single free-text address (serialised as `{ label }`).
   * `structured` → city / street / zip fields (serialised as an object).
   */
  mode: "text" | "structured";
  /** Free-text value, used when `mode === "text"`. */
  text: string;
  city: string;
  street: string;
  zip: string;
  /**
   * Keys that are not editable by the form (e.g. `lat` / `lng`) but must be
   * preserved when the address is written back.
   */
  preserved: Record<string, Json> | null;
};

export type AddressDisplayEntry = {
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

/** `true` when the jsonb holds one of the editable structured keys. */
export function isStructuredAddress(value: Json | null | undefined): boolean {
  const record = asRecord(value);
  if (!record) return false;
  return EDITABLE_ADDRESS_KEYS.some((key) => asText(record[key]) !== "");
}

/** Normalises the stored `address` jsonb into an editable form state. */
export function parseAddress(value: Json | null | undefined): AddressFormState {
  const empty: AddressFormState = {
    mode: "text",
    text: "",
    city: "",
    street: "",
    zip: "",
    preserved: null,
  };

  if (value === null || value === undefined) return empty;

  if (typeof value === "string") {
    return { ...empty, text: value.trim() };
  }

  const record = asRecord(value);
  if (!record) return empty;

  if (isStructuredAddress(value)) {
    const preserved: Record<string, Json> = {};
    for (const [key, entry] of Object.entries(record)) {
      if ((EDITABLE_ADDRESS_KEYS as readonly string[]).includes(key)) continue;
      preserved[key] = entry;
    }

    return {
      mode: "structured",
      text: "",
      city: asText(record.city),
      street: asText(record.street),
      zip: asText(record.zip),
      preserved: Object.keys(preserved).length > 0 ? preserved : null,
    };
  }

  // Not structured → free text. `label` / `formatted` become the text value,
  // everything else (lat / lng / …) is preserved as-is.
  const label = asText(record.label) || asText(record.formatted);
  const preserved: Record<string, Json> = {};
  for (const [key, entry] of Object.entries(record)) {
    if (key === "label" || key === "formatted") continue;
    preserved[key] = entry;
  }

  return {
    mode: "text",
    text: label,
    city: "",
    street: "",
    zip: "",
    preserved: Object.keys(preserved).length > 0 ? preserved : null,
  };
}

/** Converts the form state back into the `address` jsonb to persist. */
export function serializeAddress(state: AddressFormState): Json | null {
  if (state.mode === "structured") {
    const record: Record<string, Json> = { ...(state.preserved ?? {}) };

    if (state.city.trim()) record.city = state.city.trim();
    if (state.street.trim()) record.street = state.street.trim();
    if (state.zip.trim()) record.zip = state.zip.trim();

    return Object.keys(record).length > 0 ? record : null;
  }

  const text = state.text.trim();
  const record: Record<string, Json> = { ...(state.preserved ?? {}) };

  if (text) record.label = text;

  return Object.keys(record).length > 0 ? record : null;
}

/**
 * Renders the stored address as a list of Arabic-labelled entries — used by
 * the read-only "account details" tab.
 */
export function describeAddress(value: Json | null | undefined): AddressDisplayEntry[] {
  if (value === null || value === undefined) return [];

  if (typeof value === "string") {
    const text = value.trim();
    return text ? [{ label: ADDRESS_FIELD_LABELS.label, value: text }] : [];
  }

  const record = asRecord(value);
  if (!record) return [];

  const entries: AddressDisplayEntry[] = [];

  const label = asText(record.label);
  const formatted = asText(record.formatted);
  if (formatted) entries.push({ label: ADDRESS_FIELD_LABELS.formatted, value: formatted });
  else if (label) entries.push({ label: ADDRESS_FIELD_LABELS.label, value: label });

  for (const key of EDITABLE_ADDRESS_KEYS) {
    const entry = asText(record[key]);
    if (entry) {
      entries.push({ label: ADDRESS_FIELD_LABELS[key], value: entry });
    }
  }

  const lat = asText(record.lat ?? record.latitude);
  const lng = asText(record.lng ?? record.longitude);
  if (lat || lng) {
    entries.push({
      label: "الموقع",
      value: lat && lng ? `${lat}, ${lng}` : lat || lng,
    });
  }

  if (entries.length === 0) {
    for (const [key, entry] of Object.entries(record)) {
      const text = asText(entry);
      if (!text) continue;
      entries.push({
        label: ADDRESS_FIELD_LABELS[key] ?? key,
        value: text,
      });
    }
  }

  return entries;
}

/** A single-line summary of the address — used for quick references. */
export function summarizeAddress(value: Json | null | undefined): string {
  const entries = describeAddress(value);
  if (entries.length === 0) return "—";
  return entries.map((entry) => entry.value).join(" · ");
}
