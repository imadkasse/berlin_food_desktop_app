/**
 * Image URL helpers for the Menu feature.
 *
 * The database contains a few placeholder values (`"image"`, `"image_url"`)
 * that are not real URLs. Rendering them in an `<img>` would produce a broken
 * image, so they are filtered out and the warm placeholder tile is used
 * instead.
 */

/** Returns `true` when the value looks like an absolute http(s) URL. */
export function isUsableImageUrl(value: string | null | undefined): boolean {
  if (!value) return false;

  const trimmed = value.trim();

  if (!trimmed) return false;

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Returns the URL when it is usable, otherwise `null`. */
export function safeImageUrl(
  value: string | null | undefined,
): string | null {
  return isUsableImageUrl(value) ? (value as string).trim() : null;
}
