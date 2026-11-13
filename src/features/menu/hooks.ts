"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import type { MenuCategory, MenuItemView } from "./types";

export type MenuSnapshot = {
  categories: MenuCategory[];
  items: MenuItemView[];
  totalItems: number;
};

export type UseMenuSnapshotResult = MenuSnapshot & {
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Loads the full menu snapshot from the browser Supabase client.
 *
 * Categories are ordered by name and enriched with their item counts. Items are
 * ordered by newest first and enriched with the denormalised category name so
 * the grid can render the category chip without a second lookup.
 */
export function useMenuSnapshot(): UseMenuSnapshotResult {
  const [snapshot, setSnapshot] = useState<MenuSnapshot>({
    categories: [],
    items: [],
    totalItems: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSnapshot = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const [categoriesResult, itemsResult] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, image_url")
          .order("name", { ascending: true }),
        supabase
          .from("menu_items")
          .select(
            "id, category_id, name, description, price, image_url, is_available, created_at, updated_at",
          )
          .order("created_at", { ascending: false }),
      ]);

      if (categoriesResult.error) {
        throw new Error(`تعذّر تحميل التصنيفات: ${categoriesResult.error.message}`);
      }

      if (itemsResult.error) {
        throw new Error(`تعذّر تحميل الأصناف: ${itemsResult.error.message}`);
      }

      const categories = categoriesResult.data ?? [];
      const items = itemsResult.data ?? [];

      const nameById = new Map(
        categories.map((category) => [category.id, category.name]),
      );

      const counts = new Map<string, number>();

      for (const item of items) {
        if (!item.category_id) continue;
        counts.set(item.category_id, (counts.get(item.category_id) ?? 0) + 1);
      }

      const views: MenuItemView[] = items.map((item) => ({
        ...item,
        categoryName: item.category_id
          ? (nameById.get(item.category_id) ?? null)
          : null,
      }));

      setSnapshot({
        categories: categories.map((category) => ({
          id: category.id,
          name: category.name,
          image_url: category.image_url,
          itemCount: counts.get(category.id) ?? 0,
        })),
        items: views,
        totalItems: items.length,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "تعذّر تحميل القائمة. حاول مرة أخرى.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSnapshot();
  }, [fetchSnapshot]);

  return {
    ...snapshot,
    isLoading,
    error,
    refetch: fetchSnapshot,
  };
}
