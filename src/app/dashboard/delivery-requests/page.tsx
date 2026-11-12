import { Suspense } from "react";

import { assertPermission } from "@/lib/auth/guard";
import { requireSession } from "@/lib/auth/session";
import { DeliveryRequestsView } from "@/features/deliveries/components/delivery-requests-view";
import { DeliveryRequestsSkeleton } from "@/features/deliveries/components/delivery-requests-skeleton";
import {
  listDeliveryRequests,
  loadDeliveryStats,
} from "@/features/deliveries/queries";
import { parseDeliveryFilters } from "@/features/deliveries/validation";
import { DELIVERY_PAGE_SIZE } from "@/services/deliveries";

type DeliveryRequestsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * «طلبات التوصيل» — the server entry point of the page.
 *
 * Every request is authorised first: an authenticated session is required and
 * the `deliveries.read` permission is asserted before any data is loaded.
 * The queries run with the service-role client, so admins always see the full
 * list of delivery requests (never a filtered subset of their own rows).
 *
 * The filters live in the URL, which keeps every view shareable and lets the
 * browser back / forward buttons work as expected.
 */
export default async function DeliveryRequestsPage({
  searchParams,
}: DeliveryRequestsPageProps) {
  const session = await requireSession();
  await assertPermission("deliveries.read");

  const params = await searchParams;
  const filters = parseDeliveryFilters(params, DELIVERY_PAGE_SIZE);

  const [page, stats] = await Promise.all([
    listDeliveryRequests(filters),
    loadDeliveryStats(),
  ]);

  let rows = page.rows;
  let activePage = page.page;
  let pageCount = Math.max(1, Math.ceil(page.count / page.pageSize));

  // The last page may have disappeared (e.g. a request was deleted) — fall
  // back to the last existing page instead of showing an empty table.
  if (rows.length === 0 && page.count > 0 && activePage > pageCount) {
    const clamped = await listDeliveryRequests({ ...filters, page: pageCount });
    rows = clamped.rows;
    activePage = clamped.page;
    pageCount = Math.max(1, Math.ceil(clamped.count / clamped.pageSize));
  }

  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <Suspense fallback={<DeliveryRequestsSkeleton />}>
        <DeliveryRequestsView
          rows={rows}
          total={page.count}
          page={activePage}
          pageCount={pageCount}
          pageSize={page.pageSize}
          stats={stats}
          filters={{ ...filters, page: activePage }}
          canWrite={session.permissions.has("deliveries.write")}
        />
      </Suspense>
    </div>
  );
}
