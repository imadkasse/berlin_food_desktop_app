"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { IconInfo, IconShield } from "@/components/ui/icons";
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  assignableRoles,
  isPrivilegedRole,
  type Role,
} from "@/lib/auth/permissions";
import { VEHICLE_LABELS } from "@/types/app";
import { createUserAction } from "@/features/users/actions";
import { validateCreateUserInput } from "@/features/users/validation";
import type { CreateUserFieldErrors } from "@/features/users/validation";

export type CreateUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The role of the signed-in administrator — never the target role. */
  currentRole: Role | null;
  onCreated: (message: string) => void;
  onError: (message: string) => void;
};

type FormState = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: Role | "";
  vehicleType: string;
  address: string;
};

const EMPTY_FORM: FormState = {
  fullName: "",
  email: "",
  phoneNumber: "",
  password: "",
  role: "",
  vehicleType: "motorcycle",
  address: "",
};

/** The notice shown when the administrator may not create privileged roles. */
const PRIVILEGED_ROLE_NOTICE =
  "إنشاء حسابات المشرفين متاح للمدير الأعلى فقط.";

/**
 * «إضافة مستخدم» — creates a platform account.
 *
 * The role dropdown offers **only** the roles the signed-in administrator is
 * allowed to create (`assignableRoles`). An `admin` therefore sees just
 * «مندوب توصيل» و«عميل» and never a privileged role — and an explicit Arabic
 * notice explains that the privileged roles belong to the superadmin.
 *
 * The server re-checks the same rule, so the UI is only an affordance.
 */
export function CreateUserDialog({
  open,
  onOpenChange,
  currentRole,
  onCreated,
  onError,
}: CreateUserDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<CreateUserFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setErrors({});
      setFormError(null);
    }
  }, [open]);

  // The roles the current administrator may create — the source of truth for
  // the dropdown (and the server re-checks it).
  const allowedRoles = useMemo(() => assignableRoles(currentRole), [currentRole]);

  // `true` when the administrator is allowed to create privileged accounts.
  const canCreatePrivileged = allowedRoles.some((role) =>
    isPrivilegedRole(role),
  );

  const roleOptions = useMemo(
    () =>
      allowedRoles.map((role) => ({
        value: role,
        label: ROLE_LABELS[role],
      })),
    [allowedRoles],
  );

  const vehicleOptions = useMemo(
    () =>
      Object.entries(VEHICLE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    [],
  );

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.role) {
      setErrors({ role: "الدور مطلوب." });
      return;
    }

    const validation = validateCreateUserInput({
      fullName: form.fullName,
      email: form.email,
      phoneNumber: form.phoneNumber,
      password: form.password,
      role: form.role,
      vehicleType: form.vehicleType,
      address: form.address,
    });

    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      const result = await createUserAction({
        fullName: form.fullName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        password: form.password,
        role: form.role,
        vehicleType: form.vehicleType,
        address: form.address,
      });

      if (result.ok) {
        onCreated(result.message);
        onOpenChange(false);
      } else {
        setFormError(result.error);
        onError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isCourier = form.role === "delivery";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="إضافة مستخدم"
      description="أنشئ حسابًا جديدًا وأحدّد دوره وصلاحياته على المنصة."
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            إلغاء
          </Button>
          <Button type="submit" form="create-user" loading={submitting}>
            إنشاء الحساب
          </Button>
        </>
      }
    >
      <form
        id="create-user"
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

        {allowedRoles.length === 0 ? (
          <p
            role="status"
            className="flex items-start gap-2 rounded-md bg-info-soft px-4 py-3 type-body-md text-info"
          >
            <IconInfo size={18} className="mt-0.5 shrink-0" />
            <span>
              لا يمكنك إنشاء حسابات جديدة. تواصل مع المدير الأعلى لطلب إنشاء
              الحساب.
            </span>
          </p>
        ) : null}

        {!canCreatePrivileged && allowedRoles.length > 0 ? (
          <p
            role="status"
            className="flex items-start gap-2 rounded-md bg-info-soft px-4 py-3 type-body-md text-info"
          >
            <IconInfo size={18} className="mt-0.5 shrink-0" />
            <span>{PRIVILEGED_ROLE_NOTICE}</span>
          </p>
        ) : null}

        <Input
          label="الاسم الكامل"
          required
          value={form.fullName}
          onChange={(event) => update("fullName", event.target.value)}
          error={errors.fullName}
          placeholder="مثال: إيماد كاسي"
          autoComplete="name"
        />

        <Input
          label="البريد الإلكتروني"
          required
          type="email"
          dir="ltr"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          error={errors.email}
          placeholder="name@example.com"
          autoComplete="email"
        />

        <Input
          label="رقم الهاتف"
          required
          type="tel"
          dir="ltr"
          value={form.phoneNumber}
          onChange={(event) => update("phoneNumber", event.target.value)}
          error={errors.phoneNumber}
          placeholder="0675416320"
          autoComplete="tel"
        />

        <Input
          label="كلمة المرور"
          required
          type="password"
          dir="ltr"
          value={form.password}
          onChange={(event) => update("password", event.target.value)}
          error={errors.password}
          hint="ثمانية أحرف على الأقل — تُنشأ كلمة مرور مؤقتة يمكن تغييرها لاحقًا."
          autoComplete="new-password"
        />

        <Select
          label="الدور"
          required
          value={form.role}
          onChange={(event) => update("role", event.target.value as Role | "")}
          error={errors.role}
          options={roleOptions}
          placeholder="اختر الدور"
          hint={
            form.role
              ? ROLE_DESCRIPTIONS[form.role]
              : "يحدّد الدور الصلاحيات التي يمنحها الحساب على المنصة."
          }
        />

        {isCourier ? (
          <Select
            label="نوع المركبة"
            value={form.vehicleType}
            onChange={(event) => update("vehicleType", event.target.value)}
            options={vehicleOptions}
          />
        ) : null}

        {form.role === "customer" ? (
          <Input
            label="العنوان"
            value={form.address}
            onChange={(event) => update("address", event.target.value)}
            error={errors.address}
            hint="عنوان التوصيل الأساسي — يُعرض في صفحة تفاصيل المستخدم."
            placeholder="مثال: حي بربيح، مسكن 940، رقم 12"
          />
        ) : null}

        {canCreatePrivileged ? (
          <p className="flex items-start gap-2 rounded-md bg-surface-secondary px-4 py-3 type-body-sm text-muted">
            <IconShield size={16} className="mt-0.5 shrink-0" />
            <span>
              الحساب سيحصل على صلاحيات إدارية — إنشاء حساب مشرف يتطلب صلاحية
              المدير الأعلى.
            </span>
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}

export default CreateUserDialog;
