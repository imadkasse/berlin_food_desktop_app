"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { IconPlus } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import type { Role } from "@/lib/auth/permissions";
import { deleteUserAction } from "@/features/users/actions";
import {
  USER_TAB_LABELS,
  type UserCounts,
  type UserFilters,
  type UserSort,
  type UserStatusFilter,
  type UserTab,
} from "@/features/users/types";
import type { ProfileRow } from "@/types/app";
import { ChangeRoleDialog } from "./change-role-dialog";
import { CreateUserDialog } from "./create-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import { UsersFilters } from "./users-filters";
import { UsersTable } from "./users-table";

export type UsersViewProps = {
  rows: ProfileRow[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  counts: UserCounts;
  filters: UserFilters;
  /** The role of the signed-in administrator. */
  currentRole: Role | null;
  /** `true` when the administrator may create and edit accounts. */
  canWrite: boolean;
  /** `true` when the administrator may change the role of an account. */
  canManageRoles: boolean;
  /** `true` when the administrator may delete accounts. */
  canDelete: boolean;
  /** `true` when the administrator may see the «المشرفون» tab. */
  canManageAdmins: boolean;
};

/** Debounce applied to the free-text search before it reaches the server. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * «المستخدمون» — the client shell of the page.
 *
 * The server component loads the data; this component owns the filters (kept
 * in the URL so every state is shareable), the row actions and the dialogs.
 */
export function UsersView({
  rows,
  total,
  page,
  pageCount,
  pageSize,
  counts,
  filters,
  currentRole,
  canWrite,
  canManageRoles,
  canDelete,
  canManageAdmins,
}: UsersViewProps) {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(filters.q);
  const [status, setStatus] = useState<UserStatusFilter>(filters.status);
  const [sort, setSort] = useState<UserSort>(filters.sort);
  const [tab, setTab] = useState<UserTab>(filters.tab);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProfileRow | null>(null);
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

  const handleStatusChange = (value: UserStatusFilter) => {
    setStatus(value);
    updateQuery({ status: value === "all" ? null : value, page: null });
  };

  const handleSortChange = (value: UserSort) => {
    setSort(value);
    updateQuery({ sort: value === "updated_desc" ? null : value, page: null });
  };

  const handleTabChange = (value: string) => {
    const nextTab = value as UserTab;
    setTab(nextTab);
    updateQuery({ tab: nextTab === "all" ? null : nextTab, page: null });
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setSort("updated_desc");
    lastAppliedSearch.current = "";
    updateQuery({
      q: null,
      status: null,
      sort: null,
      page: null,
    });
  };

  const handlePageChange = (nextPage: number) => {
    updateQuery({ page: nextPage === 1 ? null : String(nextPage) });
  };

  const handleViewDetails = (user: ProfileRow) => {
    router.push(`/dashboard/users/${user.id}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const result = await deleteUserAction({ id: deleteTarget.id });

    if (result.ok) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const isFiltered =
    filters.q.length > 0 ||
    filters.status !== "all" ||
    filters.sort !== "updated_desc" ||
    filters.tab !== "all";

  const tabs = [
    { value: "all", label: USER_TAB_LABELS.all, count: counts.all },
    {
      value: "customers",
      label: USER_TAB_LABELS.customers,
      count: counts.customers,
    },
    {
      value: "delivery",
      label: USER_TAB_LABELS.delivery,
      count: counts.delivery,
    },
    // The «المشرفون» tab exists for the superadmin only.
    ...(canManageAdmins
      ? [{ value: "admins", label: USER_TAB_LABELS.admins, count: counts.admins }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="المستخدمون"
        description="إدارة حسابات العملاء ومندوبي التوصيل والمشرفين في منصة برلين فود"
        actions={
          canWrite ? (
            <Button
              variant="primary"
              icon={<IconPlus size={16} />}
              onClick={() => setCreateOpen(true)}
            >
              إضافة مستخدم
            </Button>
          ) : (
            <span title="لا تملك صلاحية إضافة المستخدمين.">
              <Button variant="primary" icon={<IconPlus size={16} />} disabled>
                إضافة مستخدم
              </Button>
            </span>
          )
        }
      />

      <Tabs value={tab} onValueChange={handleTabChange} tabs={tabs} />

      <UsersFilters
        search={search}
        status={status}
        sort={sort}
        isFiltered={isFiltered}
        onSearchChange={setSearch}
        onStatusChange={handleStatusChange}
        onSortChange={handleSortChange}
        onClear={handleClearFilters}
      />

      <UsersTable
        rows={rows}
        pending={isPending}
        isFiltered={isFiltered}
        canWrite={canWrite}
        canManageRoles={canManageRoles}
        canDelete={canDelete}
        onEdit={setEditTarget}
        onChangeRole={setRoleTarget}
        onDelete={setDeleteTarget}
        onViewDetails={handleViewDetails}
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

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        currentRole={currentRole}
        onCreated={(message) => {
          toast.success(message);
          router.refresh();
        }}
        onError={(message) => toast.error(message)}
      />

      <EditUserDialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        user={editTarget}
        onSaved={(message) => {
          toast.success(message);
          router.refresh();
        }}
        onError={(message) => toast.error(message)}
      />

      <ChangeRoleDialog
        open={Boolean(roleTarget)}
        onOpenChange={(open) => {
          if (!open) setRoleTarget(null);
        }}
        user={roleTarget}
        currentRole={currentRole}
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
            ? `سيتم حذف حساب «${deleteTarget.full_name ?? "مستخدم بلا اسم"}» نهائيًا، ولا يمكن التراجع عن هذا الإجراء.`
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

export default UsersView;
