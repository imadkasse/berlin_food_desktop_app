import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { IconMapPin } from "@/components/ui/icons";
import { RoleBadge, UserAvatar } from "@/components/dashboard";
import { Section } from "@/components/dashboard/section";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import {
  PERMISSION_LABELS,
  ROLE_LABELS,
  permissionsForRole,
  toRole,
} from "@/lib/auth/permissions";
import { formatDate, formatDateTime, formatPhone } from "@/lib/format";
import { vehicleLabel } from "@/types/app";
import { describeUserAddress } from "@/features/users/address";
import { loadUserById } from "@/features/users/queries";
import { UserDetailActions } from "@/features/users/components/user-detail-actions";
import { UserAvailabilityToggle } from "@/features/users/components/user-availability-toggle";
import type { GrantedPermission } from "@/features/users/types";

type UserDetailPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * «تفاصيل المستخدم» — the server entry point of the detail page.
 *
 * The account is loaded with the service-role client after the session and
 * the `users.read` permission have been verified. A missing profile is not a
 * crash: the page renders the friendly not-found state.
 */
export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const session = await requireSession();
  const { id } = await params;

  const user = await loadUserById(id);

  if (!user) {
    notFound();
  }

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
    <div dir="rtl" className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center gap-5 rounded-lg bg-surface p-6">
        <UserAvatar profile={user} size="xl" />

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="type-headline-md text-foreground">{displayName}</h1>
            <RoleBadge role={user.role} />
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
          </div>

          <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 type-body-md text-muted">
            <div className="flex items-center gap-2">
              <dt className="text-subtle">البريد الإلكتروني</dt>
              <dd className="text-foreground" dir="ltr">
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
                <dd className="type-body-md text-foreground" dir="ltr">
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
                    <dd className="type-body-md text-foreground">{entry.value}</dd>
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
            currentRole={session.role}
            canWrite={can(session.role, "users.write")}
            canManageRoles={can(session.role, "roles.manage")}
            canDelete={can(session.role, "users.delete")}
          />

          <Section
            title="معلومات النشاط"
            description="آخر تحديث على الحساب وحالته في المنصة."
          >
            <div className="flex flex-col gap-4">
              <UserAvailabilityToggle
                id={user.id}
                available={user.availability_status ?? false}
                canWrite={can(session.role, "users.write")}
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
