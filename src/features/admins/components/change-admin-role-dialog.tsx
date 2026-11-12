"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { IconInfo, IconShield } from "@/components/ui/icons";
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  assignableRoles,
  type Role,
} from "@/lib/auth/permissions";
import { changeAdminRoleAction } from "@/features/admins/actions";
import type { ProfileRow } from "@/types/app";

export type ChangeAdminRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The account whose role is being changed — `null` while none is selected. */
  user: ProfileRow | null;
  /** The role of the signed-in administrator. */
  currentRole: Role | null;
  /** The id of the signed-in administrator. */
  currentUserId: string;
  onChanged: (message: string) => void;
  onError: (message: string) => void;
};

/**
 * «تغيير الدور» — changes the role of an account of the administrators area.
 *
 * The dropdown offers only the roles the signed-in administrator may assign
 * (`assignableRoles`), and the server re-checks the very same rule through
 * `assertCanCreateRole` before writing anything.
 *
 * The account of the signed-in administrator is protected: only the role
 * «مدير أعلى» stays selectable, so nobody can lock the platform out of the
 * superadmin tier. The guard itself lives on the server
 * (`src/features/admins/actions.ts`) — this is only an affordance.
 */
export function ChangeAdminRoleDialog({
  open,
  onOpenChange,
  user,
  currentRole,
  currentUserId,
  onChanged,
  onError,
}: ChangeAdminRoleDialogProps) {
  const [role, setRole] = useState<Role | "">("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRole((user?.role as Role) ?? "");
      setFormError(null);
    }
  }, [open, user]);

  const allowedRoles = useMemo(
    () => assignableRoles(currentRole),
    [currentRole],
  );

  // The signed-in administrator may not move their own account away from
  // «مدير أعلى».
  const isCurrentAccount = Boolean(user && user.id === currentUserId);

  const roleOptions = useMemo(
    () =>
      allowedRoles.map((value) => ({
        value,
        label: ROLE_LABELS[value],
        disabled: isCurrentAccount && value !== "superadmin",
      })),
    [allowedRoles, isCurrentAccount],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || !role) {
      setFormError("اختر الدور الجديد أولًا.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await changeAdminRoleAction({ id: user.id, role });

      if (result.ok) {
        onChanged(result.message);
        onOpenChange(false);
      } else {
        setFormError(result.error);
        onError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = user?.full_name ?? "الحساب";
  const currentRoleLabel = user?.role
    ? (ROLE_LABELS[user.role as Role] ?? user.role)
    : "غير معروف";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="تغيير الدور"
      description={`تغيير صلاحيات الحساب «${displayName}».`}
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            إلغاء
          </Button>
          <Button type="submit" form="change-admin-role" loading={submitting}>
            تغيير الدور
          </Button>
        </>
      }
    >
      <form
        id="change-admin-role"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
        noValidate
      >
        {formError ? (
          <p
            role="alert"
            className="rounded-md bg-danger-soft px-4 py-3 type-body-md text-danger"
          >
            {formError}
          </p>
        ) : null}

        <p className="rounded-md bg-surface-secondary px-4 py-3 type-body-sm text-muted">
          الدور الحالي: <span className="text-foreground">{currentRoleLabel}</span>
        </p>

        <Select
          label="الدور الجديد"
          required
          value={role}
          onChange={(event) => {
            setRole(event.target.value as Role | "");
            setFormError(null);
          }}
          options={roleOptions}
          placeholder="اختر الدور الجديد"
          hint={role ? ROLE_DESCRIPTIONS[role] : undefined}
        />

        {isCurrentAccount ? (
          <p
            role="status"
            className="flex items-start gap-2 rounded-md bg-info-soft px-4 py-3 type-body-md text-info"
          >
            <IconInfo size={18} className="mt-0.5 shrink-0" />
            <span>
              لا يمكنك تغيير دورك الحالي — يبقى دور «مدير أعلى» هو الدور الوحيد
              المتاح لهذا الحساب.
            </span>
          </p>
        ) : null}

        {allowedRoles.some((value) => value === "superadmin") ? (
          <p className="flex items-start gap-2 rounded-md bg-surface-secondary px-4 py-3 type-body-sm text-muted">
            <IconShield size={16} className="mt-0.5 shrink-0" />
            <span>
              تعيين دور «مدير أعلى» يمنح صاحب الحساب صلاحية إنشاء المشرفين
              وإدارة الأدوار.
            </span>
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}

export default ChangeAdminRoleDialog;
