import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IconCalendar,
  IconMail,
  IconPhone,
  IconShield,
} from "@/components/ui/icons";
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
} from "@/lib/auth/permissions";
import { formatDate, formatPhone } from "@/lib/format";
import type { ProfileView } from "@/features/profile/types";

function SummaryRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-secondary text-muted"
      >
        {icon}
      </span>

      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="type-body-sm text-subtle">{label}</span>
        <span className="type-body-md break-words text-foreground">{children}</span>
      </div>
    </div>
  );
}

/**
 * Compact «حسابك» summary shown under the identity card:
 * role, e-mail, phone number and membership date.
 */
export function AccountSummaryCard({ view }: { view: ProfileView }) {
  const roleLabel = view.role ? ROLE_LABELS[view.role] : "غير معروف";
  const roleDescription = view.role ? ROLE_DESCRIPTIONS[view.role] : null;

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle>حسابك</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-4">
        <SummaryRow icon={<IconShield size={16} />} label="الدور">
          <span className="flex flex-col gap-1">
            <span>{roleLabel}</span>
            {roleDescription ? (
              <span className="type-body-sm text-subtle">{roleDescription}</span>
            ) : null}
          </span>
        </SummaryRow>

        <SummaryRow icon={<IconMail size={16} />} label="البريد الإلكتروني">
          {view.email ? (
            <span dir="ltr" className="tabular break-all">
              {view.email}
            </span>
          ) : (
            <span className="text-subtle">—</span>
          )}
        </SummaryRow>

        <SummaryRow icon={<IconPhone size={16} />} label="رقم الهاتف">
          {view.phoneNumber ? (
            <span dir="ltr" className="tabular">
              {formatPhone(view.phoneNumber)}
            </span>
          ) : (
            <span className="text-subtle">—</span>
          )}
        </SummaryRow>

        <SummaryRow icon={<IconCalendar size={16} />} label="عضو منذ">
          <span className="tabular">{formatDate(view.createdAt)}</span>
        </SummaryRow>
      </CardContent>
    </Card>
  );
}

export default AccountSummaryCard;
