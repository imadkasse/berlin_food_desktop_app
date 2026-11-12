import type { CategoryRow, MenuItemRow } from "@/types/app";

/**
 * Shared types for the Menu feature.
 *
 * This module is intentionally dependency-free (no `server-only`) so it can be
 * imported from both server components and client components.
 */

/** Result returned by every menu server action. */
export type ActionResult =
  | { ok: true; message: string; url?: string }
  | { ok: false; error: string };

/** A category enriched with the number of items it holds. */
export type MenuCategory = {
  id: string;
  name: string;
  image_url: string | null;
  itemCount: number;
};

/**
 * A menu item enriched with the (denormalised) name of its category and the
 * insertion timestamp used by the "الأحدث" sort.
 */
export type MenuItemView = MenuItemRow & {
  categoryName: string | null;
  created_at: string;
  updated_at: string;
};

/** Availability filter used by the toolbar. */
export type AvailabilityFilter = "all" | "available" | "unavailable";

/** Sorting options used by the toolbar. */
export type MenuSort = "name" | "price-asc" | "latest";

/** Payload accepted by the create/update product server actions. */
export type ProductPayload = {
  name: string;
  description: string | null;
  price: number;
  categoryId: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
};

/** Payload accepted by the create/update category server actions. */
export type CategoryPayload = {
  name: string;
  imageUrl: string | null;
};

/** Scope of an uploaded image (products and categories live in separate folders). */
export type ImageScope = "product" | "category";

export type { CategoryRow, MenuItemRow };
