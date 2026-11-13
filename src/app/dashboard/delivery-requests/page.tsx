"use client";

import { Suspense, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconAlert } from "@/components/ui/icons";
import { DeliveryRequestsSkeleton } from "@/features/deliveries/components/delivery-requests-skeleton";
import { DeliveryRequestsView } from "@/features/deliveries/components/delivery-requests-view";
import {
  useDeliveryRequests,
  useDeliveryStats,
} from "@/features/deliveries/hooks";
import { parseDeliveryFilters } from "@/features/deliveries/validation";
import { DELIVERY_PAGE_SIZE } from "@/features/deliveries/utils";
import { usePermission } from "@/hooks/use-permission";

/**
 * «طلبات التوصيل» — the client entry point of the page.
 *
 * Every read goes through the browser Supabase client, so Row Level Security
 * decides what the signed-in admin may see. The filters live in the URL, which
 * keeps every view shareable and lets the browser back / forward buttons work
 * as expected.
 */
function DeliveryRequestsPageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filters = useMemo(
    () =>
      parseDeliveryFilters(
        Object.fromEntries(searchParams.entries()),
        DELIVERY_PAGE_SIZE,
      ),
    [searchParams],
  );

  const {
    rows,
    count,
    page,
    pageSize,
    pageCount,
    isLoading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests,
  } = useDeliveryRequests(filters);

  const {
    stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useDeliveryStats();

  const canWrite = usePermission("deliveries.write");

  const isLoading = requestsLoading || statsLoading;
  const error = requestsError ?? statsError;

  const refetch = async () => {
    await Promise.all([refetchRequests(), refetchStats()]);
  };

  // Keep the URL in sync when the hook has to clamp to the last existing page.
  useEffect(() => {
    if (page === filters.page) return;

    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [page, filters.page, pathname, router, searchParams]);

  if (isLoading && rows.length === 0) {
    return (
      <div dir="rtl" className="flex flex-col gap-6">
        <DeliveryRequestsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" className="flex flex-col gap-6">
        <div className="rounded-lg bg-surface">
          <EmptyState
            icon={<IconAlert size={22} />}
            title="تعذّر تحميل طلبات التوصيل"
            description={error}
            action={
              <Button variant="secondary" onClick={refetch}>
                إعادة المحاولة
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <DeliveryRequestsView
        rows={rows}
        total={count}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        stats={stats}
        filters={{ ...filters, page }}
        canWrite={canWrite}
        onRefresh={refetch}
      />
    </div>
  );
}

/**
 * `useSearchParams()` forces a client-side render bailout, so the page content
 * must live inside a `<Suspense>` boundary for `output: 'export'`.
 */
export default function DeliveryRequestsPage() {
  return (
    <Suspense
      fallback={
        <div dir="rtl" className="flex flex-col gap-6">
          <DeliveryRequestsSkeleton />
        </div>
      }
    >
      <DeliveryRequestsPageContent />
    </Suspense>
  );
}
