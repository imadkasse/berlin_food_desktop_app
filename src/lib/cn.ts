/**
 * Tiny class-name joiner (no `clsx` dependency).
 *
 * Accepts strings, arrays, and objects with truthy values.
 * Falsy entries are ignored.
 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | { [key: string]: boolean | null | undefined };

function collect(value: ClassValue, out: string[]): void {
  if (!value && value !== 0) return;

  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    if (text) out.push(text);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collect(item, out);
    return;
  }

  if (typeof value === "object") {
    for (const [key, enabled] of Object.entries(value)) {
      if (enabled) out.push(key);
    }
  }
}

export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) collect(value, out);
  return out.join(" ");
}
