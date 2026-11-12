import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "@/components/dashboard/status-badge";
import { IconInfo, IconPencil, IconStar } from "@/components/ui/icons";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/auth/permissions";
import { formatDate, formatDateTime, formatNumber, formatPhone } from "@/lib/format";
import { describeAddress } from "@/features/profile/address";
import type { ProfileView } from "@/features/profile/types";

function DetailRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-surface-secondary px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
      <dt className="type-body-sm text-muted sm:w-44 sm:shrink-0">{label}</dt>

      <dd className="flex min-w-0 flex-col gap-1 text-start sm:items-end sm:text-end">
        <span className="type-body-md break-words text-foreground">{children}</span>
        {hint ? <span className="type-body-sm text-subtle">{hint}</span> : null}
      </dd>
    </div>
  );
}

export type AccountDetailsProps = {
  view: ProfileView;
  /** Switches the page back to the personal-details tab. */
  onGoToPersonal?: () => void;
};

/**
 * Tab 2 — «تفاصيل الحساب».
 *
 * A read-only view of the account: nothing here can be edited, every value
 * comes from the server-side profile row.
 */
export function AccountDetails({ view, onGoToPersonal }: AccountDetailsProps) {
  const roleLabel = view.role ? ROLE_LABELS[view.role] : "غير معروف";
  const roleDescription = view.role ? ROLE_DESCRIPTIONS[view.role] : null;
  const addressEntries = describeAddress(view.address);

  return (
    <dl className="flex flex-col gap-2">
      <DetailRow
        label="البريد الإلكتروني"
        hint="لا يمكن تغيير البريد الإلكتروني"
      >
        {view.email ? (
          <a
            href={`mailto:${view.email}`}
            dir="ltr"
            className="tabular text-primary underline-offset-4 hover:underline"
          >
            {view.email}
          </a>
        ) : (
          <span className="text-subtle">—</span>
        )}
      </DetailRow>

      <DetailRow
        label="الدور"
        hint={
          roleDescription ? (
            <span className="flex items-start gap-1.5">
              <IconInfo size={14} className="mt-0.5 shrink-0" />
              <span>
                {roleDescription}
                {view.role && view.role !== "superadmin" ? (
                  <span className="block">
                    تغيير الدور يتم من قبل المدير الأعلى فقط.
                  </span>
                ) : null}
              </span>
            </span>
          ) : null
        }
      >
        <span className="flex flex-wrap items-center justify-end gap-2">
          <RoleBadge role={view.role} />
          <span className="text-muted">{roleLabel}</span>
        </span>
      </DetailRow>

      <DetailRow label="الحالة">
        <Badge variant="success" dot>
          نشط
        </Badge>
      </DetailRow>

      <DetailRow label="تاريخ الانضمام">
        <span className="tabular">{formatDate(view.createdAt)}</span>
      </DetailRow>

      <DetailRow label="آخر تحديث">
        <span className="tabular">{formatDateTime(view.updatedAt)}</span>
      </DetailRow>

      <DetailRow
        label="رقم الهاتف"
        hint={
          onGoToPersonal ? (
            <button
              type="button"
              onClick={onGoToPersonal}
              className="inline-flex items-center gap-1.5 text-primary transition-opacity duration-150 hover:opacity-80"
            >
              <IconPencil size={13} />
              تعديل من «المعلومات الشخصية»
            </button>
          ) : null
        }
      >
        {view.phoneNumber ? (
          <span dir="ltr" className="tabular">
            {formatPhone(view.phoneNumber)}
          </span>
        ) : (
          <span className="text-subtle">لم يُسجَّل بعد</span>
        )}
      </DetailRow>

      <DetailRow
        label="العنوان"
        hint={
          onGoToPersonal ? (
            <button
              type="button"
              onClick={onGoToPersonal}
              className="inline-flex items-center gap-1.5 text-primary transition-opacity duration-150 hover:opacity-80"
            >
              <IconPencil size={13} />
              تعديل من «المعلومات الشخصية»
            </button>
          ) : null
        }
      >
        {addressEntries.length > 0 ? (
          <span className="flex flex-col gap-1">
            {addressEntries.map((entry) => (
              <span key={`${entry.label}-${entry.value}`} className="tabular">
                <span className="text-subtle">{entry.label}: </span>
                {entry.value}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-subtle">لم يُسجَّل بعد</span>
        )}
      </DetailRow>

      {typeof view.deliveryRating === "number" ? (
        <DetailRow
          label="تقييم التوصيل"
          hint={
            view.numberRatings ? (
              <span className="tabular">
                بناءً على {formatNumber(view.numberRatings)} تقييم
              </span>
            ) : null
          }
        >
          <span className="inline-flex items-center justify-end gap-1.5 tabular">
            <IconStar size={16} className="text-warning" />
            {formatNumber(view.deliveryRating)}
          </span>
        </DetailRow>
      ) : null}
    </dl>
  );
}

export default AccountDetails;
