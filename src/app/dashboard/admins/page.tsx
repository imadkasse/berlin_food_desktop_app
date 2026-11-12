import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { IconShield } from "@/components/ui/icons";
import {
  PermissionError,
  UnauthorizedError,
  assertPermission,
} from "@/lib/auth/guard";
import { requireSession } from "@/lib/auth/session";
import { AdminsView } from "@/features/admins/components/admins-view";
import {
  listPrivilegedAccounts,
  loadAdminCounts,
} from "@/features/admins/queries";
import { parseAdminFilters } from "@/features/admins/validation";
import { USERS_PAGE_SIZE } from "@/services/users";
import { AdminsSkeleton } from "./loading";

export const dynamic = "force-dynamic";

type AdminsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Superadmin-only area for managing administrator accounts.
 *
 * Security:
 * - The route guard in `src/proxy.ts` admits both `admin` and `superadmin`,
 *   so the page asserts `admins.manage` **server-side** before anything else.
 * - A missing permission is rendered as a denial state inside the normal page
 *   chrome — the route never crashes and no stack trace is exposed.
 */
export default async function AdminsPage({ searchParams }: AdminsPageProps) {
  const session = await requireSession();

  let denied = false;

  try {
    await assertPermission("admins.manage");
  } catch (error) {
    if (error instanceof PermissionError || error instanceof UnauthorizedError) {
      denied = true;
    } else {
      throw error;
    }
  }

  if (denied) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          title="المشرفون"
          description="إنشاء حسابات المشرفين وإدارة أدوارهم"
        />

        <div className="rounded-lg bg-surface border border-line/70">
          <EmptyState
            icon={<IconShield size={22} />}
            title="صلاحية غير كافية"
            description="لا تملك صلاحية الوصول إلى هذه الصفحة."
          />
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const filters = parseAdminFilters(params, USERS_PAGE_SIZE);

  const [page, counts] = await Promise.all([
    listPrivilegedAccounts(filters),
    loadAdminCounts(),
  ]);

  let rows = page.rows;
  let total = page.count;
  let activePage = page.page;
  let pageCount = Math.max(1, Math.ceil(page.count / page.pageSize));

  // The last page may have disappeared (e.g. an account was deleted) — fall
  // back to the last existing page instead of showing an empty table.
  if (rows.length === 0 && page.count > 0 && activePage > pageCount) {
    const clamped = await listPrivilegedAccounts({ ...filters, page: pageCount });
    rows = clamped.rows;
    total = clamped.count;
    activePage = clamped.page;
    pageCount = Math.max(1, Math.ceil(clamped.count / clamped.pageSize));
  }

  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <Suspense fallback={<AdminsSkeleton />}>
        <AdminsView
          rows={rows}
          total={total}
          page={activePage}
          pageCount={pageCount}
          pageSize={page.pageSize}
          counts={counts}
          filters={{ ...filters, page: activePage }}
          currentRole={session.role}
          currentUserId={session.user.id}
        />
      </Suspense>
    </div>
  );
}
