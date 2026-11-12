"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { IconAlert, IconBike, IconStar, IconTruck } from "@/components/ui/icons";
import { RoleBadge } from "@/components/dashboard/status-badge";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { formatNumber } from "@/lib/format";
import { VEHICLE_LABELS } from "@/types/app";
import type { DeliveryRequestRow } from "@/types/app";
import type { CourierMatch } from "@/features/deliveries/types";

export type CourierAccountCardProps = {
  match: CourierMatch | null;
  request: DeliveryRequestRow;
};

const MATCH_SOURCE_LABELS: Record<CourierMatch["source"], string> = {
  email: "تطابق البريد الإلكتروني",
  phone: "تطابق رقم الهاتف",
};

/**
 * «حساب المندوب» — the account that was derived for this request.
 *
 * When nothing matches, the panel says so honestly and explains how the
 * lookup was performed instead of inventing a link.
 */
export function CourierAccountCard({ match, request }: CourierAccountCardProps) {
  if (!match) {
    return (
      <div className="flex flex-col gap-3 rounded-lg bg-surface-secondary/70 p-5">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-subtle"
          >
            <IconAlert size={18} />
          </span>

          <div className="flex flex-col gap-1">
            <p className="type-headline-sm text-foreground">
              لا يوجد حساب مندوب مرتبط بهذا الطلب
            </p>
            <p className="type-body-md text-muted">
              تم البحث عن حساب مطابق أولًا بالبريد الإلكتروني{" "}
              <span className="tabular">{request.email ?? "—"}</span> ثم برقم
              الهاتف <span className="tabular">{request.phone_number}</span>،
              ولم يُعثر على أي حساب مطابق.
            </p>
            <p className="type-body-sm text-subtle">
              يمكن إنشاء حساب المندوب من صفحة المستخدمين، أو تحويل الحساب لاحقًا
              عند قبول الطلب إذا تم تسجيله beforehand.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { profile, source, isCourier } = match;
  const vehicle = profile.vehicle_type
    ? (VEHICLE_LABELS[profile.vehicle_type] ?? profile.vehicle_type)
    : "غير محدد";
  const rating = profile.delivery_rating ?? 0;
  const ratingCount = profile.number_ratings ?? 0;

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-surface-secondary/70 p-5">
      <div className="flex flex-wrap items-center gap-4">
        <UserAvatar profile={profile} size="lg" />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="type-headline-sm text-foreground">
              {profile.full_name ?? "—"}
            </p>
            <RoleBadge role={profile.role} />
          </div>

          <p className="type-body-sm text-subtle">
            {MATCH_SOURCE_LABELS[source]}
          </p>
        </div>

        <Link
          href={`/dashboard/users/${profile.id}`}
          className="type-label rounded-md px-3 py-2 text-primary transition-colors hover:bg-accent-soft"
        >
          عرض الملف
        </Link>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-md bg-surface px-3 py-2">
          <dt className="type-body-sm text-muted">مركبة التوصيل</dt>
          <dd className="type-label flex items-center gap-1.5 text-foreground">
            {profile.vehicle_type === "bicycle" ? (
              <IconBike size={16} />
            ) : (
              <IconTruck size={16} />
            )}
            {vehicle}
          </dd>
        </div>

        <div className="flex flex-col gap-1 rounded-md bg-surface px-3 py-2">
          <dt className="type-body-sm text-muted">حالة التوفّر</dt>
          <dd>
            <Badge variant={profile.availability_status ? "success" : "neutral"} dot>
              {profile.availability_status ? "متاح" : "غير متاح"}
            </Badge>
          </dd>
        </div>

        <div className="flex flex-col gap-1 rounded-md bg-surface px-3 py-2">
          <dt className="type-body-sm text-muted">التقييم</dt>
          <dd className="type-label flex items-center gap-1.5 text-foreground">
            <span aria-hidden="true" className="text-accent">
              <IconStar size={16} />
            </span>
            <span className="tabular">{formatNumber(rating)}</span>
            <span className="type-body-sm font-normal text-muted">
              من {formatNumber(ratingCount)} تقييم
            </span>
          </dd>
        </div>
      </dl>

      {!isCourier ? (
        <p className="type-body-sm text-warning">
          الحساب المطابق مسجّل بدور «عميل». يمكن تحويله إلى مندوب توصيل عند
          قبول الطلب.
        </p>
      ) : null}
    </div>
  );
}

export default CourierAccountCard;
