"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { IconBike, IconCheck, IconClock, IconClose, IconPlus } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatNumber } from "@/lib/format";
import {
  approveDeliveryRequestAction,
  deleteDeliveryRequestAction,
  updateDeliveryRequestStatusAction,
} from "@/features/deliveries/actions";
import type {
  DeliveryPeriodFilter,
  DeliveryRequestFilters,
  DeliveryStats,
  DeliveryStatusFilter,
} from "@/features/deliveries/types";
import type { DeliveryRequestRow } from "@/types/app";
import { CreateRequestDialog } from "./create-request-dialog";
import { RequestDetailDialog } from "./request-detail-dialog";
import { RequestFilters } from "./request-filters";
import { RequestsTable } from "./requests-table";

export type DeliveryRequestsViewProps = {
  rows: DeliveryRequestRow[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  stats: DeliveryStats;
  filters: DeliveryRequestFilters;
  canWrite: boolean;
};

/** Debounce applied to the free-text search before it reaches the server. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * «طلبات التوصيل» — the client shell of the page.
 *
 * The server component loads the data; this component owns the filters (kept
 * in the URL so every state is shareable), the row actions and the dialogs.
 */
export function DeliveryRequestsView({
  rows,
  total,
  page,
  pageCount,
  pageSize,
  stats,
  filters,
  canWrite,
}: DeliveryRequestsViewProps) {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(filters.q);
  const [status, setStatus] = useState<DeliveryStatusFilter>(filters.status);
  const [period, setPeriod] = useState<DeliveryPeriodFilter>(filters.period);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<DeliveryRequestRow | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<DeliveryRequestRow | null>(
    null,
  );

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
  // keystroke.
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

  const handleStatusChange = (value: DeliveryStatusFilter) => {
    setStatus(value);
    updateQuery({ status: value === "all" ? null : value, page: null });
  };

  const handlePeriodChange = (value: DeliveryPeriodFilter) => {
    setPeriod(value);
    updateQuery({ period: value === "all" ? null : value, page: null });
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setPeriod("all");
    lastAppliedSearch.current = "";
    updateQuery({ q: null, status: null, period: null, page: null });
  };

  const handlePageChange = (nextPage: number) => {
    updateQuery({ page: nextPage === 1 ? null : String(nextPage) });
  };

  const handleApprove = async (id: string, promoteCourier: boolean) => {
    const result = await approveDeliveryRequestAction({ id, promoteCourier });

    if (result.ok) {
      toast.success(result.message);
      return true;
    }

    toast.error(result.error);
    return false;
  };

  const handleReject = async (id: string) => {
    const result = await updateDeliveryRequestStatusAction({
      id,
      status: "rejected",
    });

    if (result.ok) {
      toast.success(result.message);
      return true;
    }

    toast.error(result.error);
    return false;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const result = await deleteDeliveryRequestAction({ id: deleteTarget.id });

    if (result.ok) {
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
  };

  const isFiltered =
    filters.q.length > 0 || filters.status !== "all" || filters.period !== "all";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="طلبات التوصيل"
        description="طلبات الانضمام إلى فريق التوصيل وقرارات الاعتماد"
        actions={
          canWrite ? (
            <Button
              variant="primary"
              icon={<IconPlus size={16} />}
              onClick={() => setCreateOpen(true)}
            >
              طلب توصيل جديد
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="قيد المراجعة"
          value={formatNumber(stats.pending)}
          hint="طلبات تنتظر قرار الاعتماد"
          tone="warning"
          icon={<IconClock size={18} />}
        />
        <StatCard
          label="مقبول"
          value={formatNumber(stats.approved)}
          hint="طلبات انضمّت إلى فريق التوصيل"
          tone="success"
          icon={<IconCheck size={18} />}
        />
        <StatCard
          label="مرفوض"
          value={formatNumber(stats.rejected)}
          hint="طلبات أُغلقت دون اعتماد"
          tone="danger"
          icon={<IconClose size={18} />}
        />
        <StatCard
          label="إجمالي الطلبات"
          value={formatNumber(stats.total)}
          hint="كل طلبات التوصيل المسجّلة"
          tone="info"
          icon={<IconBike size={18} />}
        />
      </div>

      <RequestFilters
        search={search}
        status={status}
        period={period}
        isFiltered={isFiltered}
        onSearchChange={setSearch}
        onStatusChange={handleStatusChange}
        onPeriodChange={handlePeriodChange}
        onClear={handleClearFilters}
      />

      <RequestsTable
        rows={rows}
        canWrite={canWrite}
        pending={isPending}
        isFiltered={isFiltered}
        onViewDetails={setDetailRequest}
        onApprove={(request) => void handleApprove(request.id, false)}
        onReject={(request) => void handleReject(request.id)}
        onDelete={setDeleteTarget}
        onClearFilters={handleClearFilters}
      />

      {total > 0 ? (
        <div className="rounded-lg bg-surface">
          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={handlePageChange}
            total={total}
            pageSize={pageSize}
          />
        </div>
      ) : null}

      <RequestDetailDialog
        request={detailRequest}
        open={Boolean(detailRequest)}
        onOpenChange={(open) => {
          if (!open) setDetailRequest(null);
        }}
        canWrite={canWrite}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <CreateRequestDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(message) => toast.success(message)}
        onError={(message) => toast.error(message)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="حذف طلب التوصيل"
        description={
          deleteTarget
            ? `سيتم حذف طلب «${deleteTarget.full_name}» نهائيًا، ولا يمكن التراجع عن هذا الإجراء.`
            : undefined
        }
        confirmLabel="حذف الطلب"
        cancelLabel="إلغاء"
        tone="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default DeliveryRequestsView;
