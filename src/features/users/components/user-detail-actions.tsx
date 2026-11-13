"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { IconPencil, IconShield, IconTrash } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Section } from "@/components/dashboard/section";
import type { Role } from "@/lib/auth/permissions";
import { deleteUser } from "@/features/users/mutations";
import type { ProfileRow } from "@/types/app";
import { ChangeRoleDialog } from "./change-role-dialog";
import { EditUserDialog } from "./edit-user-dialog";

export type UserDetailActionsProps = {
  user: ProfileRow;
  /** The role of the signed-in administrator. */
  currentRole: Role | null;
  /** `true` when the administrator may edit the profile fields. */
  canWrite: boolean;
  /** `true` when the administrator may change the role of the account. */
  canManageRoles: boolean;
  /** `true` when the administrator may delete the account. */
  canDelete: boolean;
  /** Called after the account was edited or its role changed. */
  onUpdated?: () => void | Promise<void>;
  /** Called after the account was deleted. */
  onDeleted?: () => void | Promise<void>;
};

/**
 * «إجراءات» — the privileged operations on a single account.
 *
 * Every action the signed-in administrator may **not** perform is omitted
 * entirely rather than shown as a disabled control.
 *
 * The mutations run through the Edge Functions, which re-assert the caller's
 * permissions server-side; the flags above are only affordances.
 */
export function UserDetailActions({
  user,
  currentRole,
  canWrite,
  canManageRoles,
  canDelete,
  onUpdated,
  onDeleted,
}: UserDetailActionsProps) {
  const toast = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const displayName = user.full_name ?? "مستخدم بلا اسم";

  const handleDelete = async () => {
    const result = await deleteUser({ id: user.id });

    if (result.ok) {
      toast.success(result.message);
      await onDeleted?.();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <>
      <Section
        title="إجراءات"
        description="العمليات التي يمكنك تنفيذها على هذا الحساب."
        contentClassName="flex flex-col gap-2"
      >
        {canWrite ? (
          <Button
            variant="secondary"
            icon={<IconPencil size={16} />}
            onClick={() => setEditOpen(true)}
            className="w-full justify-start"
          >
            تعديل البيانات
          </Button>
        ) : null}

        {canManageRoles ? (
          <Button
            variant="secondary"
            icon={<IconShield size={16} />}
            onClick={() => setRoleOpen(true)}
            className="w-full justify-start"
          >
            تغيير الدور
          </Button>
        ) : null}

        {canDelete ? (
          <Button
            variant="danger"
            icon={<IconTrash size={16} />}
            onClick={() => setDeleteOpen(true)}
            className="w-full justify-start"
          >
            حذف الحساب
          </Button>
        ) : null}

        {!canWrite && !canManageRoles && !canDelete ? (
          <p className="type-body-sm text-muted">
            لا تملك أي صلاحية تعديل على هذا الحساب — العرض فقط.
          </p>
        ) : null}
      </Section>

      <EditUserDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={user}
        onSaved={(message) => {
          toast.success(message);
          void onUpdated?.();
        }}
        onError={(message) => toast.error(message)}
      />

      <ChangeRoleDialog
        open={roleOpen}
        onOpenChange={setRoleOpen}
        user={user}
        currentRole={currentRole}
        onChanged={(message) => {
          toast.success(message);
          void onUpdated?.();
        }}
        onError={(message) => toast.error(message)}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف الحساب"
        description={`سيتم حذف حساب «${displayName}» نهائيًا، ولا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف الحساب"
        cancelLabel="إلغاء"
        tone="danger"
        onConfirm={handleDelete}
      />
    </>
  );
}

export default UserDetailActions;
