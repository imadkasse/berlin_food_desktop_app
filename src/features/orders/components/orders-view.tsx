"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { IconClock, IconPackage, IconRefresh, IconTruck, IconWallet } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { useToast } from "@/components/ui/toast";
import { formatNumber } from "@/lib/format";
import { orderReference } from "@/features/orders/utils";
import type {
  OrderFilters,
  OrderListRow,
  OrderPeriodFilter,
  OrderSortOption,
  OrderStats,
  OrderStatusFilter,
} from "@/features/orders/types";
import { OrdersFilters } from "./orders-filters";
import { OrdersTable } from "./orders-table";
import { StatusDialog } from "./status-dialog";
import { OrderDetailDrawer } from "./order-detail-drawer";

export type OrdersViewProps = {
  rows: OrderListRow[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  stats: OrderStats;
  filters: OrderFilters;
  canWrite: boolean;
  onRefresh: () => Promise<void> | void;
};

/** Debounce applied to the free-text search before it reaches the server. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * «الطلبات» — the client shell of the page.
 *
 * The server component loads the data; this component owns the filters (kept
 * in the URL so every state is shareable), the pagination and the status
 * dialog.
 */
export function OrdersView({
  rows,
  total,
  page,
  pageCount,
  pageSize,
  stats,
  filters,
  canWrite,
  onRefresh,
}: OrdersViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(filters.q);
  const [status, setStatus] = useState<OrderStatusFilter>(filters.status);
  const [period, setPeriod] = useState<OrderPeriodFilter>(filters.period);
  const [sort, setSort] = useState<OrderSortOption>(filters.sort);

  const [statusTarget, setStatusTarget] = useState<OrderListRow | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  const lastAppliedSearch = useRef(filters.q);

  const updateQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(patch)) {
        if (!value) params.delete(key);
        else params.set(key, value);
      }

      const query = params.toString();

      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  // Debounced search: the query only reaches the server 300 ms after the last
  // keystroke, and the pagination resets to the first page.
  useEffect(() => {
    if (search === lastAppliedSearch.current) return;

    const timer = window.setTimeout(() => {
      lastAppliedSearch.current = search;
      updateQuery({ q: search.trim() || null, page: null });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [search, updateQuery]);

  // Keeps the input in sync when the URL changes from the outside (browser
  // back / forward, or a cleared filter from the server).
  useEffect(() => {
    if (filters.q === lastAppliedSearch.current) return;
    lastAppliedSearch.current = filters.q;
    setSearch(filters.q);
  }, [filters.q]);

  const handleStatusChange = (value: OrderStatusFilter) => {
    setStatus(value);
    updateQuery({ status: value === "all" ? null : value, page: null });
  };

  const handlePeriodChange = (value: OrderPeriodFilter) => {
    setPeriod(value);
    updateQuery({ period: value === "all" ? null : value, page: null });
  };

  const handleSortChange = (value: OrderSortOption) => {
    setSort(value);
    updateQuery({ sort: value === "newest" ? null : value, page: null });
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setPeriod("all");
    setSort("newest");
    lastAppliedSearch.current = "";
    updateQuery({ q: null, status: null, period: null, sort: null, page: null });
  };

  const handlePageChange = (nextPage: number) => {
    updateQuery({ page: nextPage === 1 ? null : String(nextPage) });
  };

  const handleRefresh = () => {
    startTransition(() => {
      void onRefresh();
    });
  };

  const isFiltered =
    filters.q.length > 0 ||
    filters.status !== "all" ||
    filters.period !== "all" ||
    filters.sort !== "newest";

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الطلبات"
        description="متابعة طلبات برلين فود وإدارة حالتها من الطلب إلى التسليم"
        actions={
          <Button
            variant="ghost"
            onClick={handleRefresh}
            loading={isPending}
            icon={<IconRefresh size={16} />}
          >
            تحديث
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="طلبات اليوم"
          value={formatNumber(stats.today)}
          hint="الطلبات المسجّلة منذ منتصف الليل"
          icon={<IconWallet size={18} />}
          tone="default"
        />
        <StatCard
          label="قيد التحضير"
          value={formatNumber(stats.preparing)}
          hint="طلبات في المطبخ بانتظار الجاهزية"
          icon={<IconPackage size={18} />}
          tone="warning"
        />
        <StatCard
          label="في الطريق"
          value={formatNumber(stats.outForDelivery)}
          hint="طلبات في طريقها إلى العملاء"
          icon={<IconTruck size={18} />}
          tone="info"
        />
        <StatCard
          label="تم التسليم اليوم"
          value={formatNumber(stats.deliveredToday)}
          hint="طلبات سُلّمت بنجاح منذ منتصف الليل"
          icon={<IconClock size={18} />}
          tone="success"
        />
      </div>

      <OrdersFilters
        search={search}
        status={status}
        period={period}
        sort={sort}
        isFiltered={isFiltered}
        onSearchChange={setSearch}
        onStatusChange={handleStatusChange}
        onPeriodChange={handlePeriodChange}
        onSortChange={handleSortChange}
        onClear={handleClearFilters}
      />

      <OrdersTable
        rows={rows}
        isFiltered={isFiltered}
        canWrite={canWrite}
        pending={isPending}
        onChangeStatus={setStatusTarget}
        onClearFilters={handleClearFilters}
        onViewDetails={setDetailOrderId}
      />

      {total > 0 ? (
        <div className="rounded-lg bg-surface">
          <p className="px-4 pt-3 type-body-sm text-muted tabular">
            عرض {formatNumber(from)}–{formatNumber(to)} من {formatNumber(total)}{" "}
            طلبًا
          </p>
          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={handlePageChange}
          />
        </div>
      ) : null}

      <StatusDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => {
          if (!open) setStatusTarget(null);
        }}
        orderId={statusTarget?.id ?? ""}
        orderReference={orderReference(statusTarget?.id)}
        currentStatus={statusTarget?.status ?? "pending"}
        onUpdated={(result) => {
          if (result.ok) {
            toast.success(result.message);
            void onRefresh();
            return;
          }

          toast.error(result.error);
        }}
      />

      <OrderDetailDrawer
        orderId={detailOrderId}
        onClose={() => setDetailOrderId(null)}
        onStatusUpdated={onRefresh}
      />
    </div>
  );
}

export default OrdersView;
