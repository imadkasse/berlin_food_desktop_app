"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { VEHICLE_LABELS } from "@/types/app";
import { updateUser } from "@/features/users/mutations";
import { validateUpdateUserInput } from "@/features/users/validation";
import type { UpdateUserFieldErrors } from "@/features/users/validation";
import type { ProfileRow } from "@/types/app";

export type EditUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The edited account — `null` while no row is selected. */
  user: ProfileRow | null;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
};

type FormState = {
  fullName: string;
  email: string;
  phoneNumber: string;
  vehicleType: string;
  available: boolean;
  address: string;
};

function toFormState(user: ProfileRow | null): FormState {
  if (!user) {
    return {
      fullName: "",
      email: "",
      phoneNumber: "",
      vehicleType: "motorcycle",
      available: true,
      address: "",
    };
  }

  const address = user.address;
  const addressText =
    address && typeof address === "object" && !Array.isArray(address)
      ? String(
          (address as Record<string, unknown>).label ??
            (address as Record<string, unknown>).formatted ??
            "",
        )
      : typeof address === "string"
        ? address
        : "";

  return {
    fullName: user.full_name ?? "",
    email: user.email ?? "",
    phoneNumber: user.phone_number ?? "",
    vehicleType: user.vehicle_type ?? "motorcycle",
    available: user.availability_status ?? true,
    address: addressText,
  };
}

/**
 * «تعديل البيانات» — updates the editable fields of an account.
 *
 * The role is **not** editable here: a role change is a separate, more
 * privileged operation handled by `change-role-dialog`.
 */
export function EditUserDialog({
  open,
  onOpenChange,
  user,
  onSaved,
  onError,
}: EditUserDialogProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(user));
  const [errors, setErrors] = useState<UpdateUserFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(toFormState(user));
      setErrors({});
      setFormError(null);
    }
  }, [open, user]);

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

    if (!user) return;

    const validation = validateUpdateUserInput({
      id: user.id,
      fullName: form.fullName,
      email: form.email,
      phoneNumber: form.phoneNumber,
      vehicleType: form.vehicleType,
      availabilityStatus: form.available,
      address: form.address,
    });

    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateUser({
        id: user.id,
        fullName: form.fullName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        vehicleType: form.vehicleType,
        availabilityStatus: form.available,
        address: form.address,
      });

      if (result.ok) {
        onSaved(result.message);
        onOpenChange(false);
      } else {
        setFormError(result.error);
        onError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = user?.full_name ?? "المستخدم";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="تعديل البيانات"
      description={`تعديل بيانات الحساب «${displayName}».`}
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
          <Button type="submit" form="edit-user" loading={submitting}>
            حفظ التغييرات
          </Button>
        </>
      }
    >
      <form
        id="edit-user"
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

        <Input
          label="الاسم الكامل"
          required
          value={form.fullName}
          onChange={(event) => update("fullName", event.target.value)}
          error={errors.fullName}
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
          autoComplete="tel"
        />

        <Select
          label="نوع المركبة"
          value={form.vehicleType}
          onChange={(event) => update("vehicleType", event.target.value)}
          options={vehicleOptions}
        />

        <Switch
          checked={form.available}
          onCheckedChange={(value) => update("available", value)}
          label="الحساب نشط"
          description="الحسابات غير النشطة لا تظهر في قوائم التوصيل النشطة."
        />

        <Input
          label="العنوان"
          value={form.address}
          onChange={(event) => update("address", event.target.value)}
          error={errors.address}
          placeholder="مثال: حي بربيح، مسكن 940، رقم 12"
        />
      </form>
    </Dialog>
  );
}

export default EditUserDialog;
