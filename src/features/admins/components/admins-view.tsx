"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { IconInfo, IconLock, IconPlus, IconShield, IconUsers } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import type { Role } from "@/lib/auth/permissions";
import { deleteAdminAccountAction } from "@/features/admins/actions";
import type { AdminCounts, AdminFilters, AdminRoleFilter } from "@/features/admins/types";
import type { ProfileRow } from "@/types/app";
import { AdminsFilters } from "./admins-filters";
import { AdminsTable } from "./admins-table";
import { ChangeAdminRoleDialog } from "./change-admin-role-dialog";
import { CreateAdminDialog } from "./create-admin-dialog";

export type AdminsViewProps = {
  rows: ProfileRow[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  counts: AdminCounts;
  filters: AdminFilters;
  /** The role of the signed-in administrator. */
  currentRole: Role | null;
  /** The id of the signed-in administrator. */
  currentUserId: string;
};

/** Debounce applied to the free-text search before it reaches the server. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * The tier model of the platform, spelled out honestly.
 *
 * The «مدير» and «دعم» roles hold **no** dashboard permission — they cannot
 * act inside the panel at all, so the banner says so instead of implying
 * otherwise.
 */
const TIER_MODEL_NOTICE =
  "مستويات الصلاحية: مدير أعلى (كل الصلاحيات)، مشرف (إدارة العمليات اليومية)، مدير ودعم (أدوار محجوزة بلا صلاحيات داخل اللوحة).";

const TIER_MODEL_HINT =
  "حسابات «مدير» و«دعم» لا يمكنها فتح لوحة التحكم — لا تملك أي صلاحية داخلها.";

/**
 * «المشرفون» — the client shell of the page.
 *
 * The server component loads the data; this component owns the filters (kept
 * in the URL so every state is shareable), the row actions and the dialogs.
 */
export function AdminsView({
  rows,
  total,
  page,
  pageCount,
  pageSize,
  counts,
  filters,
  currentRole,
  currentUserId,
}: AdminsViewProps) {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(filters.q);
  const [role, setRole] = useState<AdminRoleFilter>(filters.role);

  const [createOpen, setCreateOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<ProfileRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProfileRow | null>(null);

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

  const handleRoleChange = (value: AdminRoleFilter) => {
    setRole(value);
    updateQuery({ role: value === "all" ? null : value, page: null });
  };

  const handleClearFilters = () => {
    setSearch("");
    setRole("all");
    lastAppliedSearch.current = "";
    updateQuery({ q: null, role: null, page: null });
  };

  const handlePageChange = (nextPage: number) => {
    updateQuery({ page: nextPage === 1 ? null : String(nextPage) });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const result = await deleteAdminAccountAction({ id: deleteTarget.id });

    if (result.ok) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const isFiltered = filters.q.length > 0 || filters.role !== "all";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="المشرفون"
        description="إنشاء حسابات المشرفين وإدارة أدوارهم وصلاحياتهم"
        actions={
          <Button
            variant="primary"
            icon={<IconPlus size={16} />}
            onClick={() => setCreateOpen(true)}
          >
            إضافة مشرف
          </Button>
        }
      />

      <p className="flex items-start gap-2 rounded-lg bg-info-soft px-4 py-3 type-body-md text-info">
        <IconInfo size={18} className="mt-0.5 shrink-0" />
        <span className="flex flex-col gap-1">
          <span>{TIER_MODEL_NOTICE}</span>
          <span className="type-body-sm opacity-90">{TIER_MODEL_HINT}</span>
        </span>
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="إجمالي الحسابات الإدارية"
          value={counts.total}
          icon={<IconUsers size={18} />}
          hint="كل الحسابات ذات صلاحية إدارية"
        />
        <StatCard
          label="مدير أعلى"
          value={counts.superadmin}
          icon={<IconShield size={18} />}
          tone="info"
          hint="صلاحيات كاملة — إنشاء المشرفين والحذف"
        />
        <StatCard
          label="مشرف"
          value={counts.admin}
          icon={<IconUsers size={18} />}
          tone="success"
          hint="إدارة العمليات اليومية داخل اللوحة"
        />
        <StatCard
          label="أدوار محجوزة"
          value={counts.manager + counts.support}
          icon={<IconLock size={18} />}
          tone="warning"
          hint="«مدير» و«دعم» — بلا صلاحيات داخل اللوحة"
        />
      </div>

      <AdminsFilters
        search={search}
        role={role}
        isFiltered={isFiltered}
        onSearchChange={setSearch}
        onRoleChange={handleRoleChange}
        onClear={handleClearFilters}
      />

      <AdminsTable
        rows={rows}
        pending={isPending}
        isFiltered={isFiltered}
        currentUserId={currentUserId}
        onChangeRole={setRoleTarget}
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

      <CreateAdminDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        currentRole={currentRole}
        onCreated={(message) => {
          toast.success(message);
          router.refresh();
        }}
        onError={(message) => toast.error(message)}
      />

      <ChangeAdminRoleDialog
        open={Boolean(roleTarget)}
        onOpenChange={(open) => {
          if (!open) setRoleTarget(null);
        }}
        user={roleTarget}
        currentRole={currentRole}
        currentUserId={currentUserId}
        onChanged={(message) => {
          toast.success(message);
          router.refresh();
        }}
        onError={(message) => toast.error(message)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="حذف الحساب"
        description={
          deleteTarget
            ? `سيتم حذف حساب «${deleteTarget.full_name ?? "حساب بلا اسم"}» نهائيًا، ولا يمكن التراجع عن هذا الإجراء.`
            : undefined
        }
        confirmLabel="حذف الحساب"
        cancelLabel="إلغاء"
        tone="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default AdminsView;
