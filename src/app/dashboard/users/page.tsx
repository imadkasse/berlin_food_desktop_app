import { Suspense } from "react";

import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { UsersView } from "@/features/users/components/users-view";
import { UsersSkeleton } from "@/features/users/components/users-skeleton";
import {
  listUsers,
  loadUserCounts,
} from "@/features/users/queries";
import { parseUserFilters } from "@/features/users/validation";
import { USERS_PAGE_SIZE } from "@/services/users";

type UsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * «المستخدمون» — the server entry point of the page.
 *
 * Every request is authorised first: an authenticated session is required and
 * the `users.read` permission is asserted before any data is loaded.
 * The queries themselves run with the service-role client, because the
 * dashboard needs the complete list of accounts (including the e-mail).
 */
export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await requireSession();

  const params = await searchParams;
  const filters = parseUserFilters(params, USERS_PAGE_SIZE);

  const [page, counts] = await Promise.all([
    listUsers(filters),
    loadUserCounts(),
  ]);

  const pageCount = Math.max(1, Math.ceil(page.count / page.pageSize));

  // The last page may have been removed (e.g. an account was deleted) — fall
  // back to the last existing page instead of showing an empty table.
  if (page.rows.length === 0 && page.count > 0 && page.page > pageCount) {
    const clamped = await listUsers({ ...filters, page: pageCount });

    return (
      <div dir="rtl" className="flex flex-col gap-6">
        <Suspense fallback={<UsersSkeleton />}>
          <UsersView
            rows={clamped.rows}
            total={clamped.count}
            page={clamped.page}
            pageCount={Math.max(1, Math.ceil(clamped.count / clamped.pageSize))}
            pageSize={clamped.pageSize}
            counts={counts}
            filters={{ ...filters, page: clamped.page }}
            currentRole={session.role}
            canWrite={can(session.role, "users.write")}
            canManageRoles={can(session.role, "roles.manage")}
            canDelete={can(session.role, "users.delete")}
            canManageAdmins={can(session.role, "admins.manage")}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <Suspense fallback={<UsersSkeleton />}>
        <UsersView
          rows={page.rows}
          total={page.count}
          page={page.page}
          pageCount={pageCount}
          pageSize={page.pageSize}
          counts={counts}
          filters={filters}
          currentRole={session.role}
          canWrite={can(session.role, "users.write")}
          canManageRoles={can(session.role, "roles.manage")}
          canDelete={can(session.role, "users.delete")}
          canManageAdmins={can(session.role, "admins.manage")}
        />
      </Suspense>
    </div>
  );
}
