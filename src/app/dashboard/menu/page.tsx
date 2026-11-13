"use client";

import { MenuView } from "@/features/menu/components/menu-view";

/**
 * «القائمة» — the menu management page.
 *
 * The data snapshot, filters, mutations and dialogs are all managed inside
 * `MenuView` through the browser Supabase client. The page itself is now a
 * thin client entry point so the dashboard can be exported as a static app.
 */
export default function MenuPage() {
  return <MenuView />;
}
