"use client";

import { useCallback, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { IconAlert, IconClose, IconMapPin, IconUsers } from "@/components/ui/icons";
import { PageHeader } from "@/components/dashboard/page-header";
import { RoleBadge, UserAvatar } from "@/components/dashboard";
import { Section } from "@/components/dashboard/section";
import {
  PERMISSION_LABELS,
  permissionsForRole,
  ROLE_LABELS,
  toRole,
} from "@/lib/auth/permissions";
import { formatDate, formatDateTime, formatPhone } from "@/lib/format";
import { useCan, useRole } from "@/lib/session";
import { vehicleLabel } from "@/types/app";
import { describeUserAddress } from "@/features/users/address";
import { useUserById } from "@/features/users/hooks";
import type { GrantedPermission } from "@/features/users/types";
import type { ProfileRow } from "@/types/app";
import { UserAvailabilityToggle } from "./user-availability-toggle";
import { UserDetailActions } from "./user-detail-actions";

export type UserDetailDrawerProps = {
  /** The account to display — `null` while the drawer is closed. */
  userId: string | null;
  onClose: () => void;
  /** Called after any mutation so the underlying list can refetch. */
  onChanged?: () => void | Promise<void>;
};

/**
 * «تفاصيل المستخدم» — a slide-over drawer that replaces the dedicated detail
 * route and keeps the administrator on the users list.
 *
 * The drawer anchors to the logical end of the screen (left in RTL) and
 * renders the same information previously shown on `/dashboard/users/[id]`.
 * The permission flags are UI affordances only: RLS and the Edge Functions
 * enforce the real rules.
 */
export function UserDetailDrawer({
  userId,
  onClose,
  onChanged,
}: UserDetailDrawerProps) {
  const { user, isLoading, error, refetch } = useUserById(userId);

  const role = useRole();
  const canWrite = useCan("users.write");
  const canManageRoles = useCan("roles.manage");
  const canDelete = useCan("users.delete");

  useEffect(() => {
    if (!userId) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [userId, onClose]);

  const handleUpdated = useCallback(async () => {
    await refetch();
    await onChanged?.();
  }, [refetch, onChanged]);

  const handleDeleted = useCallback(async () => {
    onClose();
    await onChanged?.();
  }, [onClose, onChanged]);

  if (!userId) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-[rgba(43,33,27,0.45)]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="absolute inset-y-0 end-0 flex w-full max-w-3xl flex-col bg-background shadow-[0_0_50px_-12px_rgba(43,33,27,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <UserDetailDrawerSkeleton />
          ) : error ? (
            <div className="rounded-lg bg-surface">
              <EmptyState
                icon={<IconAlert size={22} />}
                title="تعذّر تحميل تفاصيل الحساب"
                description={error}
                action={
                  <Button variant="secondary" onClick={refetch}>
                    إعادة المحاولة
                  </Button>
                }
              />
            </div>
          ) : !user ? (
            <div className="rounded-lg bg-surface">
              <EmptyState
                icon={<IconUsers size={22} />}
                title="هذا الحساب غير موجود"
                description="ربما حُذف الحساب أو تغيّر معرّفه. عد إلى قائمة المستخدمين لاختيار حساب آخر."
                action={
                  <Button variant="secondary" onClick={onClose}>
                    العودة إلى المستخدمين
                  </Button>
                }
              />
            </div>
          ) : (
            <UserDetailDrawerContent
              user={user}
              currentRole={role}
              canWrite={canWrite}
              canManageRoles={canManageRoles}
              canDelete={canDelete}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function UserDetailDrawerContent({
  user,
  currentRole,
  canWrite,
  canManageRoles,
  canDelete,
  onUpdated,
  onDeleted,
  onClose,
}: {
  user: ProfileRow;
  currentRole: ReturnType<typeof useRole>;
  canWrite: boolean;
  canManageRoles: boolean;
  canDelete: boolean;
  onUpdated: () => Promise<void> | void;
  onDeleted: () => Promise<void> | void;
  onClose: () => void;
}) {
  const role = toRole(user.role);
  const permissions = [...permissionsForRole(role)].map<GrantedPermission>(
    (permission) => ({
      key: permission,
      label: PERMISSION_LABELS[permission],
    }),
  );

  const addressEntries = describeUserAddress(user.address);
  const displayName = user.full_name ?? "مستخدم بلا اسم";
  const roleLabel = role ? ROLE_LABELS[role] : "غير معروف";
  const isCourier = user.role === "delivery";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-5 rounded-lg bg-surface p-6">
        <PageHeader
          title={displayName}
          description={user.email ?? "حساب بدون بريد إلكتروني"}
          actions={
            <>
              <RoleBadge role={user.role} />
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق اللوحة"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface-secondary hover:text-foreground"
              >
                <IconClose size={18} />
              </button>
            </>
          }
        />

        <div className="flex flex-wrap items-center gap-6 border-t border-line/70 pt-5">
          <UserAvatar profile={user} size="xl" />

          <dl className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-3 type-body-md text-muted">
            <div className="flex items-center gap-2">
              <dt className="text-subtle">البريد الإلكتروني</dt>
              <dd className="break-all text-foreground" dir="ltr">
                {user.email ?? "—"}
              </dd>
            </div>

            <div className="flex items-center gap-2">
              <dt className="text-subtle">رقم الهاتف</dt>
              <dd className="tabular text-foreground" dir="ltr">
                {formatPhone(user.phone_number)}
              </dd>
            </div>

            <div className="flex items-center gap-2">
              <dt className="text-subtle">الدور</dt>
              <dd className="text-foreground">{roleLabel}</dd>
            </div>

            <div className="flex items-center gap-2">
              <dt className="text-subtle">آخر تحديث</dt>
              <dd className="text-foreground">{formatDate(user.updated_at)}</dd>
            </div>

            <div className="flex items-center gap-2">
              <dt className="text-subtle">الحالة</dt>
              <dd>
                {user.availability_status === null ? (
                  <Badge variant="neutral">الحالة غير محددة</Badge>
                ) : user.availability_status ? (
                  <Badge variant="success" dot>
                    نشط
                  </Badge>
                ) : (
                  <Badge variant="neutral" dot>
                    غير متاح
                  </Badge>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <Section
            title="معلومات الحساب"
            description="البيانات الأساسية التي يعرضها الفريق عند مراسلة صاحب الحساب."
          >
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <dt className="type-label text-muted">الاسم الكامل</dt>
                <dd className="type-body-md text-foreground">{displayName}</dd>
              </div>

              <div className="flex flex-col gap-1">
                <dt className="type-label text-muted">البريد الإلكتروني</dt>
                <dd className="type-body-md break-all text-foreground" dir="ltr">
                  {user.email ?? "—"}
                </dd>
              </div>

              <div className="flex flex-col gap-1">
                <dt className="type-label text-muted">رقم الهاتف</dt>
                <dd className="type-body-md tabular text-foreground" dir="ltr">
                  {formatPhone(user.phone_number)}
                </dd>
              </div>

              <div className="flex flex-col gap-1">
                <dt className="type-label text-muted">الدور</dt>
                <dd className="type-body-md text-foreground">{roleLabel}</dd>
              </div>
            </dl>
          </Section>

          <Section
            title="الصلاحيات"
            description="ما الذي يسمح به دور هذا الحساب على المنصة."
          >
            {permissions.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {permissions.map((permission) => (
                  <li key={permission.key}>
                    <Badge variant="info">{permission.label}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="type-body-md text-muted">
                هذا الدور لا يمنح أي صلاحية إدارية على المنصة.
              </p>
            )}
          </Section>

          <Section
            title="العنوان"
            description="العنوان المسجّل في ملف الحساب."
          >
            {addressEntries.length > 0 ? (
              <dl className="flex flex-col gap-3">
                {addressEntries.map((entry) => (
                  <div
                    key={`${entry.label}-${entry.value}`}
                    className="flex flex-wrap items-baseline gap-2"
                  >
                    <dt className="type-label text-muted">{entry.label}</dt>
                    <dd className="type-body-md text-foreground">
                      {entry.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="flex items-center gap-2 type-body-md text-muted">
                <IconMapPin size={16} className="text-subtle" />
                لم يُسجَّل عنوان لهذا الحساب.
              </p>
            )}
          </Section>
        </div>

        <aside className="flex flex-col gap-6">
          <UserDetailActions
            user={user}
            currentRole={currentRole}
            canWrite={canWrite}
            canManageRoles={canManageRoles}
            canDelete={canDelete}
            onUpdated={onUpdated}
            onDeleted={onDeleted}
          />

          <Section
            title="معلومات النشاط"
            description="آخر تحديث على الحساب وحالته في المنصة."
          >
            <div className="flex flex-col gap-4">
              <UserAvailabilityToggle
                id={user.id}
                available={user.availability_status ?? false}
                canWrite={canWrite}
                onChanged={onUpdated}
              />

              <dl className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="type-label text-muted">آخر تحديث</dt>
                  <dd className="type-body-md text-foreground">
                    {formatDateTime(user.updated_at)}
                  </dd>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="type-label text-muted">حالة التوفّر</dt>
                  <dd className="type-body-md text-foreground">
                    {user.availability_status === null
                      ? "—"
                      : user.availability_status
                        ? "نشط"
                        : "غير متاح"}
                  </dd>
                </div>

                {isCourier ? (
                  <>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <dt className="type-label text-muted">نوع المركبة</dt>
                      <dd className="type-body-md text-foreground">
                        {vehicleLabel(user.vehicle_type)}
                      </dd>
                    </div>

                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <dt className="type-label text-muted">تقييم التوصيل</dt>
                      <dd className="type-body-md tabular text-foreground">
                        {user.delivery_rating ?? 0} من 5
                        {user.number_ratings
                          ? ` (${user.number_ratings} تقييم)`
                          : " (لا توجد تقييمات)"}
                      </dd>
                    </div>
                  </>
                ) : null}
              </dl>
            </div>
          </Section>
        </aside>
      </div>
    </div>
  );
}

function UserDetailDrawerSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">جارٍ تحميل تفاصيل المستخدم…</span>

      <div className="flex flex-col gap-5 rounded-lg bg-surface p-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>

        <Skeleton className="h-20 w-full" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDetailDrawer;
