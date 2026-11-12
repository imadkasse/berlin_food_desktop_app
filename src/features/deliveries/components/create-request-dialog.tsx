"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createDeliveryRequestAction } from "@/features/deliveries/actions";
import { validateDeliveryRequestInput } from "@/features/deliveries/validation";
import type { DeliveryRequestFieldErrors } from "@/features/deliveries/validation";

export type CreateRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (message: string) => void;
  onError: (message: string) => void;
};

type FormState = {
  fullName: string;
  phoneNumber: string;
  email: string;
};

const EMPTY_FORM: FormState = {
  fullName: "",
  phoneNumber: "",
  email: "",
};

/**
 * «طلب توصيل جديد» — creates a delivery request.
 *
 * The new request always starts as «قيد المراجعة»; accepting it is a separate
 * decision made from the table or the detail panel.
 */
export function CreateRequestDialog({
  open,
  onOpenChange,
  onCreated,
  onError,
}: CreateRequestDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<DeliveryRequestFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setErrors({});
      setFormError(null);
    }
  }, [open]);

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validateDeliveryRequestInput({
      fullName: form.fullName,
      phoneNumber: form.phoneNumber,
      email: form.email,
    });

    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      const result = await createDeliveryRequestAction({
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        email: form.email || null,
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

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="طلب توصيل جديد"
      description="سجّل طلب انضمام مندوب إلى فريق التوصيل. يبدأ الطلب بحالة «قيد المراجعة» حتى تتخذ قرار الاعتماد."
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
          <Button type="submit" form="create-delivery-request" loading={submitting}>
            حفظ الطلب
          </Button>
        </>
      }
    >
      <form
        id="create-delivery-request"
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
          placeholder="مثال: إيماد كاسي"
          autoComplete="name"
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
          label="البريد الإلكتروني"
          type="email"
          dir="ltr"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          error={errors.email}
          hint="اختياري — يُستخدم للبحث عن حساب المندوب عند قبول الطلب."
          placeholder="name@example.com"
          autoComplete="email"
        />
      </form>
    </Dialog>
  );
}

export default CreateRequestDialog;
