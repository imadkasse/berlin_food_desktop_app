import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

/**
 * Local schema override for the Menu feature.
 *
 * `supabase/migrations/20261111000200_menu_items_timestamps.sql` added the
 * `created_at` / `updated_at` columns to `public.menu_items`. The shared
 * generated types in `src/types/database.types.ts` are owned by the foundation
 * agent and still describe the pre-migration shape, so this module layers the
 * two new columns on top of the shared types.
 *
 * The override is additive: once the shared types are regenerated the two
 * definitions stay structurally identical and this file can be dropped.
 */

type SharedMenuItems = Database["public"]["Tables"]["menu_items"];

export type MenuItemTimestamps = {
  created_at: string;
  updated_at: string;
};

export type MenuItemsTable = {
  Row: SharedMenuItems["Row"] & MenuItemTimestamps;
  Insert: SharedMenuItems["Insert"] & Partial<MenuItemTimestamps>;
  Update: SharedMenuItems["Update"] & Partial<MenuItemTimestamps>;
  Relationships: SharedMenuItems["Relationships"];
};

/** The shared `Database` type with the `menu_items` table replaced. */
export type MenuDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Omit<Database["public"]["Tables"], "menu_items"> & {
      menu_items: MenuItemsTable;
    };
  };
};

/**
 * Narrows the shared admin client to the menu-aware schema.
 *
 * The cast is safe because only the `menu_items` table differs, and the
 * columns added by the migration are a strict superset of the shared ones.
 */
export function asMenuClient(
  client: SupabaseClient<Database>,
): SupabaseClient<MenuDatabase> {
  return client as unknown as SupabaseClient<MenuDatabase>;
}
