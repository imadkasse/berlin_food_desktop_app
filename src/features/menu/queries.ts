import "server-only";

import {
  countItemsByCategory,
  listCategories,
  listMenuItems,
} from "@/services/menu";

import type { MenuCategory, MenuItemView } from "./types";

/** Everything the menu page needs in one round trip. */
export type MenuSnapshot = {
  categories: MenuCategory[];
  items: MenuItemView[];
  totalItems: number;
};

/**
 * Loads the full menu snapshot: categories (with their item counts) and the
 * items themselves.
 *
 * The category name is denormalised onto each item so the client can render
 * the category chip without a second lookup.
 */
export async function loadMenuSnapshot(): Promise<MenuSnapshot> {
  const [categories, items, counts] = await Promise.all([
    listCategories(),
    listMenuItems(),
    countItemsByCategory(),
  ]);

  const nameById = new Map(categories.map((category) => [category.id, category.name]));

  const views: MenuItemView[] = items.map((item) => ({
    ...item,
    categoryName: item.category_id ? (nameById.get(item.category_id) ?? null) : null,
  }));

  return {
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      image_url: category.image_url,
      itemCount: counts.get(category.id) ?? 0,
    })),
    items: views,
    totalItems: items.length,
  };
}
