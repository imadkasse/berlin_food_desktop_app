/**
 * Berlin Food — Users feature constants.
 *
 * This module is pure and client-safe: it is imported by the browser hooks,
 * the admin hooks and the route pages alike.
 */

/** Number of rows shown on one page of the users table. */
export const USERS_PAGE_SIZE = 20;

/**
 * Removes the characters that would break a PostgREST `or=(...)` filter
 * expression (a comma, a parenthesis, a quote or a backslash).
 *
 * The `%` and `_` wildcards are kept on purpose — they are valid `ilike`
 * wildcards and simply widen the search.
 */
export function sanitizeSearchTerm(raw: string): string {
  return raw
    .replace(/[,()"\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
