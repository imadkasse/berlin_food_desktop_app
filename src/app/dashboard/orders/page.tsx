"use client";

import { useMemo, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconAlert } from "@/components/ui/icons";
import { OrdersView } from "@/features/orders/components/orders-view";
import { useOrders, useOrderStats } from "@/features/orders/hooks";
import { parseOrderFilters } from "@/features/orders/validation";
import { ORDERS_PAGE_SIZE } from "@/features/orders/utils";
import { usePermission } from "@/hooks/use-permission";
import { OrdersSkeleton } from "./loading";

/**
 * «الطلبات» — the client entry point of the orders page.
 *
 * Filters live in the URL so every view remains shareable. All reads, stats,
 * and mutations now flow through the browser Supabase client; the server-side
 * `orders` actions/queries/service have been removed.
 */
export default function OrdersPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filters = useMemo(
    () =>
      parseOrderFilters(
        Object.fromEntries(searchParams.entries()),
        ORDERS_PAGE_SIZE,
      ),
    [searchParams],
  );

  const {
    rows,
    count,
    page,
    pageSize,
    pageCount,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useOrders(filters);

  const {
    stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useOrderStats();

  const canWrite = usePermission("orders.write");

  const isLoading = ordersLoading || statsLoading;
  const error = ordersError ?? statsError;

  const refetch = async () => {
    await Promise.all([refetchOrders(), refetchStats()]);
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
        <OrdersSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" className="flex flex-col gap-6">
        <div className="rounded-lg bg-surface">
          <EmptyState
            icon={<IconAlert size={22} />}
            title="تعذّر تحميل الطلبات"
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
      <OrdersView
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
