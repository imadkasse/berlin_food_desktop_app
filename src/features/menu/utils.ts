/**
 * Pure, client-safe helpers for the Menu feature.
 *
 * Nothing in this module touches the database or the server runtime, so it can
 * be imported from both server and client components.
 */

import type { MenuItemRow } from "@/types/app";

import type { AvailabilityFilter, MenuSort } from "./types";

/** Normalises the nullable `is_available` column (DB default is `true`). */
export function isItemAvailable(
  item: Pick<MenuItemRow, "is_available">,
): boolean {
  return item.is_available ?? true;
}

/** Sorts items by the requested order. */
export function sortMenuItems<T extends MenuItemRow & { created_at: string }>(
  items: T[],
  sort: MenuSort,
): T[] {
  const copy = [...items];

  switch (sort) {
    case "price-asc":
      copy.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
      break;
    case "latest":
      // Newest insertion first. `menu_items.created_at` is a real timestamp
      // (added by migration 20261111000200), so this is a true chronological
      // order rather than a guess based on the random UUID.
      copy.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      break;
    case "name":
    default:
      copy.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  return copy;
}

/** Arabic pluralisation helper for item counts. */
export function pluralizeItems(count: number): string {
  if (count === 0) return "لا توجد أصناف";
  if (count === 1) return "صنف واحد";
  if (count === 2) return "صنفان";
  if (count <= 10) return `${count} أصناف`;
  return `${count} صنفًا`;
}

/** Arabic pluralisation helper for category counts. */
export function pluralizeCategories(count: number): string {
  if (count === 0) return "لا توجد تصنيفات";
  if (count === 1) return "تصنيف واحد";
  if (count === 2) return "تصنيفان";
  if (count <= 10) return `${count} تصنيفات`;
  return `${count} تصنيفًا`;
}

/** Filters items by category, availability and free-text query. */
export function filterMenuItems<T extends MenuItemRow & { created_at: string }>(
  items: T[],
  options: {
    categoryId: string | null;
    availability: AvailabilityFilter;
    query: string;
  },
): T[] {
  const query = options.query.trim().toLowerCase();

  return items.filter((item) => {
    if (options.categoryId && item.category_id !== options.categoryId) {
      return false;
    }

    if (
      options.availability === "available" &&
      !isItemAvailable(item)
    ) {
      return false;
    }

    if (
      options.availability === "unavailable" &&
      isItemAvailable(item)
    ) {
      return false;
    }

    if (query) {
      const haystack = `${item.name} ${item.description ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}
