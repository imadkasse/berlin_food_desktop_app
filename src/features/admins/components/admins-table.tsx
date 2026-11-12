"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import {
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
import {
  describeRoleCapabilities,
  describeRolePermissionLabels,
} from "@/features/admins/capabilities";
import type { ProfileRow } from "@/types/app";

export type AdminsTableProps = {
  rows: ProfileRow[];
  /** `true` while a filtered page is being fetched. */
  pending: boolean;
  /** `true` when at least one filter is active. */
  isFiltered: boolean;
  /** The id of the signed-in administrator. */
  currentUserId: string;
  onChangeRole: (row: ProfileRow) => void;
  onDelete: (row: ProfileRow) => void;
  onClearFilters: () => void;
};

/**
 * «المشرفون» table.
 *
 * Column order follows the RTL reading order: the account comes first (right
 * side), the row actions come last (left side).
 *
 * The «الصلاحيات» column states what the role of the row can *really* do —
 * the sentence is derived from the permission matrix
 * (`src/lib/auth/permissions.ts`), never hard-coded.
 */
export function AdminsTable({
  rows,
  pending,
  isFiltered,
  currentUserId,
  onChangeRole,
  onDelete,
  onClearFilters,
}: AdminsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg bg-surface">
        {isFiltered ? (
          <EmptyState
            icon={<IconUsers size={20} />}
            title="لا توجد نتائج مطابقة"
            description="لم نعثر على أي حساب إداري يطابق البحث أو عامل التصفية الحالي. جرّب تعديل كلمة البحث أو توسيع نطاق البحث."
            action={
              <Button variant="secondary" onClick={onClearFilters}>
                مسح عوامل التصفية
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<IconShield size={20} />}
            title="لا توجد حسابات إدارية"
            description="لم يُنشأ أي حساب بصلاحية إدارية بعد. ابدأ بإضافة أول مشرف."
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={
        pending
          ? "rounded-lg opacity-60 transition-opacity duration-150"
          : undefined
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>المشرف</TableHead>
            <TableHead>الدور</TableHead>
            <TableHead>البريد الإلكتروني</TableHead>
            <TableHead>رقم الهاتف</TableHead>
            <TableHead>آخر تحديث</TableHead>
            <TableHead>الصلاحيات</TableHead>
            <TableHead>إجراءات</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((row) => {
            const isCurrentAccount = row.id === currentUserId;

            return (
              <TableRow key={row.id} className="hover:bg-surface-hover">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar profile={row} size="md" />
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">
                        {row.full_name ?? "حساب بلا اسم"}
                      </span>
                      {isCurrentAccount ? (
                        <Badge variant="primary">حسابك الحالي</Badge>
                      ) : null}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <RoleBadge role={row.role} />
                </TableCell>

                <TableCell>
                  <span className="text-muted" dir="ltr">
                    {row.email ?? "—"}
                  </span>
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
                  <span className="text-muted" title={formatDateTime(row.updated_at)}>
                    {formatRelativeTime(row.updated_at)}
                  </span>
                </TableCell>

                <TableCell>
                  <span
                    className="text-muted"
                    title={describeRolePermissionLabels(row.role)}
                  >
                    {describeRoleCapabilities(row.role)}
                  </span>
                </TableCell>

                <TableCell>
                  <DropdownMenu
                    align="end"
                    trigger={
                      <span className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-secondary hover:text-foreground">
                        <IconShield size={18} />
                      </span>
                    }
                    items={[
                      {
                        label: "تغيير الدور",
                        onSelect: () => onChangeRole(row),
                        icon: <IconPencil size={16} />,
                      },
                      // The account of the signed-in administrator cannot be
                      // deleted — the label says why instead of failing later.
                      ...(isCurrentAccount
                        ? [
                            {
                              label: "حذف الحساب (غير متاح لحسابك)",
                              disabled: true,
                              icon: <IconTrash size={16} />,
                            },
                          ]
                        : [
                            {
                              label: "حذف الحساب",
                              onSelect: () => onDelete(row),
                              danger: true,
                              icon: <IconTrash size={16} />,
                            },
                          ]),
                    ]}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default AdminsTable;
