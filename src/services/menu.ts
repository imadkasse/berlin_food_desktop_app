import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { asMenuClient } from "@/features/menu/database.types";
import type { CategoryRow, MenuItemRow } from "@/types/app";

/**
 * Menu data access.
 *
 * Every function here runs on the server and uses the service-role client so
 * that RLS never interferes with the dashboard's own reads/writes. Callers are
 * still expected to assert the required permission before mutating data
 * (see `src/features/menu/actions.ts`).
 */

/**
 * The `menu_items` row shape including the timestamp columns added by
 * `supabase/migrations/20261111000200_menu_items_timestamps.sql`.
 */
export type MenuItemRecord = MenuItemRow & {
  created_at: string;
  updated_at: string;
};

/** Lists every category, ordered by name. */
export async function listCategories(): Promise<CategoryRow[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("categories")
    .select("id, name, image_url")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`تعذّر تحميل التصنيفات: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Lists every menu item, newest first.
 *
 * `menu_items.created_at` is the real insertion timestamp (added by
 * `supabase/migrations/20261111000200_menu_items_timestamps.sql`), so the
 * "الأحدث" sort is a genuine chronological order rather than a guess.
 */
export async function listMenuItems(): Promise<MenuItemRecord[]> {
  const admin = asMenuClient(createAdminClient());

  const { data, error } = await admin
    .from("menu_items")
    .select(
      "id, category_id, name, description, price, image_url, is_available, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`تعذّر تحميل الأصناف: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Counts the items that belong to each category.
 *
 * The map is keyed by category id; categories without items are simply absent
 * (callers should default to `0`).
 */
export async function countItemsByCategory(): Promise<Map<string, number>> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("menu_items")
    .select("id, category_id");

  if (error) {
    throw new Error(`تعذّر حساب عدد الأصناف: ${error.message}`);
  }

  const counts = new Map<string, number>();

  for (const item of data ?? []) {
    if (!item.category_id) continue;
    counts.set(item.category_id, (counts.get(item.category_id) ?? 0) + 1);
  }

  return counts;
}

/** Returns the exact number of items currently attached to a category. */
export async function countItemsInCategory(categoryId: string): Promise<number> {
  const admin = createAdminClient();

  const { count, error } = await admin
    .from("menu_items")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (error) {
    throw new Error(`تعذّر حساب عدد الأصناف: ${error.message}`);
  }

  return count ?? 0;
}

/** Returns a single menu item by id, or `null` when it does not exist. */
export async function getMenuItem(id: string): Promise<MenuItemRecord | null> {
  const admin = asMenuClient(createAdminClient());

  const { data, error } = await admin
    .from("menu_items")
    .select(
      "id, category_id, name, description, price, image_url, is_available, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`تعذّر تحميل الصنف: ${error.message}`);
  }

  return data ?? null;
}

/** Returns a single category by id, or `null` when it does not exist. */
export async function getCategory(id: string): Promise<CategoryRow | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("categories")
    .select("id, name, image_url")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`تعذّر تحميل التصنيف: ${error.message}`);
  }

  return data ?? null;
}

/** Checks whether a category id actually exists (used to validate products). */
export async function categoryExists(categoryId: string): Promise<boolean> {
  const category = await getCategory(categoryId);
  return category !== null;
}
