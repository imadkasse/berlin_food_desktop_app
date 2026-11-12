import { Suspense } from "react";

import { assertPermission } from "@/lib/auth/guard";
import { can } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { OrdersView } from "@/features/orders/components/orders-view";
import { listOrders, loadOrderStats } from "@/features/orders/queries";
import { parseOrderFilters } from "@/features/orders/validation";
import { ORDERS_PAGE_SIZE } from "@/services/orders";
import { OrdersSkeleton } from "./loading";

export const dynamic = "force-dynamic";

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * «الطلبات» — the server entry point of the page.
 *
 * Every request is authorised first: an authenticated session is required and
 * the `orders.read` permission is asserted before any data is loaded, so an
 * unauthorised account can never reach the orders data (the queries run with
 * the service-role client).
 *
 * The filters live in the URL, which keeps every view shareable and lets the
 * browser back / forward buttons work as expected.
 */
export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const session = await requireSession();
  await assertPermission("orders.read");

  const params = await searchParams;
  const filters = parseOrderFilters(params, ORDERS_PAGE_SIZE);

  const [page, stats] = await Promise.all([
    listOrders(filters),
    loadOrderStats(),
  ]);

  let rows = page.rows;
  let total = page.count;
  let activePage = page.page;
  let pageCount = Math.max(1, Math.ceil(page.count / page.pageSize));

  // The last page may have disappeared (e.g. an order was deleted) — fall
  // back to the last existing page instead of showing an empty table.
  if (rows.length === 0 && page.count > 0 && activePage > pageCount) {
    const clamped = await listOrders({ ...filters, page: pageCount });
    rows = clamped.rows;
    total = clamped.count;
    activePage = clamped.page;
    pageCount = Math.max(1, Math.ceil(clamped.count / clamped.pageSize));
  }

  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersView
          rows={rows}
          total={total}
          page={activePage}
          pageCount={pageCount}
          pageSize={page.pageSize}
          stats={stats}
          filters={{ ...filters, page: activePage }}
          canWrite={can(session.role, "orders.write")}
        />
      </Suspense>
    </div>
  );
}
