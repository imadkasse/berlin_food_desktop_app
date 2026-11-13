"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconAlert } from "@/components/ui/icons";
import { useCan, useRole } from "@/lib/session";
import { UsersView } from "@/features/users/components/users-view";
import { UsersSkeleton } from "@/features/users/components/users-skeleton";
import { UserDetailDrawer } from "@/features/users/components/user-detail-drawer";
import { USERS_PAGE_SIZE } from "@/features/users/constants";
import { useUserCounts, useUsers } from "@/features/users/hooks";
import { parseUserFilters } from "@/features/users/validation";

/**
 * «المستخدمون» — the client entry point of the users page.
 *
 * Filters live in the URL so every view remains shareable. All reads flow
 * through the browser Supabase client (Row Level Security decides what the
 * signed-in administrator may see) and every privileged write goes through the
 * `admin-*` Edge Functions.
 *
 * The permission flags below are UI affordances only — the authoritative
 * checks live in RLS and in the Edge Functions.
 */
function UsersPageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filters = useMemo(
    () =>
      parseUserFilters(
        Object.fromEntries(searchParams.entries()),
        USERS_PAGE_SIZE,
      ),
    [searchParams],
  );

  const {
    rows,
    count,
    page,
    pageSize,
    pageCount,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useUsers(filters);

  const {
    counts,
    isLoading: countsLoading,
    error: countsError,
    refetch: refetchCounts,
  } = useUserCounts();

  const currentRole = useRole();
  const canWrite = useCan("users.write");
  const canManageRoles = useCan("roles.manage");
  const canDelete = useCan("users.delete");
  const canManageAdmins = useCan("admins.manage");

  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    await Promise.all([refetchUsers(), refetchCounts()]);
  }, [refetchUsers, refetchCounts]);

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

  const isLoading = usersLoading || countsLoading;
  const error = usersError ?? countsError;

  if (isLoading && rows.length === 0) {
    return (
      <div dir="rtl" className="flex flex-col gap-6">
        <UsersSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" className="flex flex-col gap-6">
        <div className="rounded-lg bg-surface">
          <EmptyState
            icon={<IconAlert size={22} />}
            title="تعذّر تحميل المستخدمين"
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
      <UsersView
        rows={rows}
        total={count}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        counts={counts}
        filters={{ ...filters, page }}
        currentRole={currentRole}
        canWrite={canWrite}
        canManageRoles={canManageRoles}
        canDelete={canDelete}
        canManageAdmins={canManageAdmins}
        onRefresh={refetch}
        onViewDetails={setDetailUserId}
      />

      <UserDetailDrawer
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
        onChanged={refetch}
      />
    </div>
  );
}

/**
 * `useSearchParams()` forces a client-side render bailout, so the page content
 * must live inside a `<Suspense>` boundary for `output: 'export'`.
 */
export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div dir="rtl" className="flex flex-col gap-6">
          <UsersSkeleton />
        </div>
      }
    >
      <UsersPageContent />
    </Suspense>
  );
}
