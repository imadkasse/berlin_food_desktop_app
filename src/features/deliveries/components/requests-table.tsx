"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import {
  IconCheck,
  IconClose,
  IconEye,
  IconMoreVertical,
  IconPackage,
  IconTrash,
} from "@/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeliveryStatusBadge } from "@/components/dashboard/status-badge";
import { formatDateTime, formatPhone, formatRelativeTime } from "@/lib/format";
import type { DeliveryRequestRow } from "@/types/app";

export type RequestsTableProps = {
  rows: DeliveryRequestRow[];
  canWrite: boolean;
  /** `true` while a filtered page is being fetched. */
  pending: boolean;
  /** `true` when at least one filter is active. */
  isFiltered: boolean;
  onViewDetails: (request: DeliveryRequestRow) => void;
  onApprove: (request: DeliveryRequestRow) => void;
  onReject: (request: DeliveryRequestRow) => void;
  onDelete: (request: DeliveryRequestRow) => void;
  onClearFilters: () => void;
};

/**
 * «طلبات التوصيل» table.
 *
 * Column order follows the RTL reading order: the courier comes first (right
 * side), the row actions come last (left side).
 */
export function RequestsTable({
  rows,
  canWrite,
  pending,
  isFiltered,
  onViewDetails,
  onApprove,
  onReject,
  onDelete,
  onClearFilters,
}: RequestsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg bg-surface">
        {isFiltered ? (
          <EmptyState
            icon={<IconPackage size={20} />}
            title="لا توجد نتائج مطابقة"
            description="لم نعثر على أي طلب توصيل يطابق البحث أو عوامل التصفية الحالية. جرّب تعديل كلمة البحث أو توسيع الفترة."
            action={
              <Button variant="secondary" onClick={onClearFilters}>
                مسح عوامل التصفية
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<IconPackage size={20} />}
            title="لا توجد طلبات توصيل بعد"
            description="لم يسجّل أي مندوب طلبًا للانضمام إلى فريق التوصيل حتى الآن. أضف طلبًا جديدًا للبدء."
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
            <TableHead>المندوب</TableHead>
            <TableHead>رقم الهاتف</TableHead>
            <TableHead>البريد الإلكتروني</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>تاريخ الطلب</TableHead>
            <TableHead>آخر تحديث</TableHead>
            <TableHead>إجراءات</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar name={row.full_name} size="sm" />
                  <span className="font-semibold text-foreground">
                    {row.full_name}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <a
                  href={`tel:${row.phone_number}`}
                  className="tabular inline-flex items-center gap-1.5 text-muted transition-colors hover:text-primary"
                >
                  {formatPhone(row.phone_number)}
                </a>
              </TableCell>

              <TableCell>
                {row.email ? (
                  <a
                    href={`mailto:${row.email}`}
                    className="inline-flex items-center gap-1.5 break-all text-muted transition-colors hover:text-primary"
                  >
                    {row.email}
                  </a>
                ) : (
                  <span className="text-subtle">—</span>
                )}
              </TableCell>

              <TableCell>
                <DeliveryStatusBadge status={row.status} />
              </TableCell>

              <TableCell className="text-muted">
                {formatDateTime(row.created_at)}
              </TableCell>

              <TableCell className="text-muted">
                {formatRelativeTime(row.updated_at)}
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
                      onSelect: () => onViewDetails(row),
                      icon: <IconEye size={16} />,
                    },
                    ...(canWrite
                      ? [
                          {
                            label: "قبول الطلب",
                            onSelect: () => onApprove(row),
                            disabled: row.status === "approved",
                            icon: <IconCheck size={16} />,
                          },
                          {
                            label: "رفض الطلب",
                            onSelect: () => onReject(row),
                            disabled: row.status === "rejected",
                            danger: true,
                            icon: <IconClose size={16} />,
                          },
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

export default RequestsTable;
