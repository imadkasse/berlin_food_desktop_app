import { Suspense } from "react";

import { assertPermission } from "@/lib/auth/guard";
import { requireSession } from "@/lib/auth/session";
import { MenuView } from "@/features/menu/components/menu-view";
import { ProductGridSkeleton } from "@/features/menu/components/product-grid-skeleton";
import { loadMenuSnapshot } from "@/features/menu/queries";

export const dynamic = "force-dynamic";

/**
 * «القائمة» — the server entry point of the page.
 *
 * Every request is authorised first: an authenticated session is required and
 * the `menu.read` permission is asserted before any data is loaded. The route
 * guard in `src/proxy.ts` only admits `admin` / `superadmin`, so the
 * permission assertion stays in place as the authoritative server-side check.
 *
 * The snapshot (categories with their item counts + the items themselves) is
 * then read with the service-role client. The interactive part — category
 * rail, filters, product grid and every dialog — lives in `MenuView`; the
 * empty states (no categories / no items) are rendered by the view itself.
 */
export default async function MenuPage() {
  await requireSession();
  await assertPermission("menu.read");

  const snapshot = await loadMenuSnapshot();

  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <Suspense fallback={<ProductGridSkeleton />}>
        <MenuView
          categories={snapshot.categories}
          items={snapshot.items}
          totalItems={snapshot.totalItems}
        />
      </Suspense>
    </div>
  );
}
