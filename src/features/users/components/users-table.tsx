"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import {
  IconEye,
  IconMoreVertical,
  IconPencil,
  IconShield,
  IconTrash,
  IconUsers,
} from "@/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleBadge, UserAvatar } from "@/components/dashboard";
import { formatDateTime, formatPhone, formatRelativeTime } from "@/lib/format";
import { summarizeUserAddress } from "@/features/users/address";
import type { ProfileRow } from "@/types/app";

export type UsersTableProps = {
  rows: ProfileRow[];
  /** `true` while a filtered page is being fetched. */
  pending: boolean;
  /** `true` when at least one filter is active. */
  isFiltered: boolean;
  /** `true` when the current administrator may edit the profile fields. */
  canWrite: boolean;
  /** `true` when the current administrator may change roles. */
  canManageRoles: boolean;
  /** `true` when the current administrator may delete accounts. */
  canDelete: boolean;
  onEdit: (user: ProfileRow) => void;
  onChangeRole: (user: ProfileRow) => void;
  onDelete: (user: ProfileRow) => void;
  onViewDetails: (userId: string) => void;
  onClearFilters: () => void;
};

/**
 * The status badge of a user.
 *
 * The Arabic label is always rendered next to the colour, so the status is
 * never conveyed by colour alone. A `null` availability is shown as an em
 * dash instead of being guessed.
 */
function AvailabilityBadge({
  availability,
}: {
  availability: boolean | null;
}) {
  if (availability === null) {
    return <span className="text-subtle">—</span>;
  }

  return (
    <Badge variant={availability ? "success" : "neutral"} dot>
      {availability ? "نشط" : "غير متاح"}
    </Badge>
  );
}

/**
 * «المستخدمون» table.
 *
 * Column order follows the RTL reading order: the account comes first (right
 * side), the row actions come last (left side).
 */
export function UsersTable({
  rows,
  pending,
  isFiltered,
  canWrite,
  canManageRoles,
  canDelete,
  onEdit,
  onChangeRole,
  onDelete,
  onViewDetails,
  onClearFilters,
}: UsersTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg bg-surface">
        {isFiltered ? (
          <EmptyState
            icon={<IconUsers size={20} />}
            title="لا توجد نتائج مطابقة"
            description="لم نعثر على أي مستخدم يطابق البحث أو عوامل التصفية الحالية. جرّب تعديل كلمة البحث أو توسيع نطاق البحث."
            action={
              <Button variant="secondary" onClick={onClearFilters}>
                مسح عوامل التصفية
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<IconUsers size={20} />}
            title="لا يوجد مستخدمون بعد"
            description="لم يسجّل أي حساب على المنصة حتى الآن. أضف أول مستخدم للبدء."
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={
        pending ? "rounded-lg opacity-60 transition-opacity duration-150" : undefined
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>المستخدم</TableHead>
            <TableHead>الدور</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>رقم الهاتف</TableHead>
            <TableHead>العنوان</TableHead>
            <TableHead>آخر تحديث</TableHead>
            <TableHead>إجراءات</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className="hover:bg-surface-hover">
              <TableCell>
                <div className="flex items-center gap-3">
                  <UserAvatar profile={row} size="md" />
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {row.full_name ?? "مستخدم بلا اسم"}
                    </span>
                    <span className="type-body-sm text-muted" dir="ltr">
                      {row.email ?? "—"}
                    </span>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <RoleBadge role={row.role} />
              </TableCell>

              <TableCell>
                <AvailabilityBadge availability={row.availability_status} />
              </TableCell>

              <TableCell>
                {row.phone_number ? (
                  <a
                    href={`tel:${row.phone_number}`}
                    dir="ltr"
                    className="tabular inline-flex items-center gap-1.5 text-muted transition-colors hover:text-primary"
                  >
                    {formatPhone(row.phone_number)}
                  </a>
                ) : (
                  <span className="text-subtle">—</span>
                )}
              </TableCell>

              <TableCell>
                <span className="text-muted">
                  {summarizeUserAddress(row.address)}
                </span>
              </TableCell>

              <TableCell>
                <span
                  className="text-muted"
                  title={formatDateTime(row.updated_at)}
                >
                  {formatRelativeTime(row.updated_at)}
                </span>
              </TableCell>

              <TableCell>
                <DropdownMenu
                  align="end"
                  trigger={
                    <span className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-secondary hover:text-foreground">
                      <IconMoreVertical size={18} />
                    </span>
                  }
                  items={[
                    {
                      label: "عرض التفاصيل",
                      onSelect: () => onViewDetails(row.id),
                      icon: <IconEye size={16} />,
                    },
                    // The privileged actions are hidden for administrators who
                    // may not perform them — not merely disabled.
                    ...(canWrite
                      ? [
                          {
                            label: "تعديل البيانات",
                            onSelect: () => onEdit(row),
                            icon: <IconPencil size={16} />,
                          },
                        ]
                      : []),
                    ...(canManageRoles
                      ? [
                          {
                            label: "تغيير الدور",
                            onSelect: () => onChangeRole(row),
                            icon: <IconShield size={16} />,
                          },
                        ]
                      : []),
                    ...(canDelete
                      ? [
                          {
                            label: "حذف",
                            onSelect: () => onDelete(row),
                            danger: true,
                            icon: <IconTrash size={16} />,
                          },
                        ]
                      : []),
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default UsersTable;
