"use client";

import { Suspense, useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconAlert, IconShield } from "@/components/ui/icons";
import { useCan, useRole } from "@/lib/session";
import { useSessionStore } from "@/stores/session";
import { AdminsView } from "@/features/admins/components/admins-view";
import { useAdminCounts, usePrivilegedAccounts } from "@/features/admins/hooks";
import { parseAdminFilters } from "@/features/admins/validation";
import { USERS_PAGE_SIZE } from "@/features/users/constants";
import { AdminsSkeleton } from "./loading";

/**
 * Superadmin-only area for managing administrator accounts.
 *
 * Security: the `RequireAuth` gate admits the dashboard, then Row Level
 * Security hides the administrative tier from every account without
 * `admins.manage`. The denial state below is the UI counterpart of that rule,
 * and the Edge Functions re-assert the permission on every write.
 */
function AdminsPageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filters = useMemo(
    () =>
      parseAdminFilters(
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
    isLoading: accountsLoading,
    error: accountsError,
    refetch: refetchAccounts,
  } = usePrivilegedAccounts(filters);

  const {
    counts,
    isLoading: countsLoading,
    error: countsError,
    refetch: refetchCounts,
  } = useAdminCounts();

  const currentRole = useRole();
  const canManageAdmins = useCan("admins.manage");
  const currentUserId = useSessionStore((state) => state.user?.id ?? "");

  const refetch = useCallback(async () => {
    await Promise.all([refetchAccounts(), refetchCounts()]);
  }, [refetchAccounts, refetchCounts]);

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

  if (!canManageAdmins) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          title="المشرفون"
          description="إنشاء حسابات المشرفين وإدارة أدوارهم"
        />

        <div className="rounded-lg border border-line/70 bg-surface">
          <EmptyState
            icon={<IconShield size={22} />}
            title="صلاحية غير كافية"
            description="لا تملك صلاحية الوصول إلى هذه الصفحة."
          />
        </div>
      </div>
    );
  }

  const isLoading = accountsLoading || countsLoading;
  const error = accountsError ?? countsError;

  if (isLoading && rows.length === 0) {
    return (
      <div dir="rtl" className="flex flex-col gap-6">
        <AdminsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" className="flex flex-col gap-6">
        <div className="rounded-lg bg-surface">
          <EmptyState
            icon={<IconAlert size={22} />}
            title="تعذّر تحميل المشرفين"
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
      <AdminsView
        rows={rows}
        total={count}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        counts={counts}
        filters={{ ...filters, page }}
        currentRole={currentRole}
        currentUserId={currentUserId}
        onRefresh={refetch}
      />
    </div>
  );
}

/**
 * `useSearchParams()` forces a client-side render bailout, so the page content
 * must live inside a `<Suspense>` boundary for `output: 'export'`.
 */
export default function AdminsPage() {
  return (
    <Suspense
      fallback={
        <div dir="rtl" className="flex flex-col gap-6">
          <AdminsSkeleton />
        </div>
      }
    >
      <AdminsPageContent />
    </Suspense>
  );
}
