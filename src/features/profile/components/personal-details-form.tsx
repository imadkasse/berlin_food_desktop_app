"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IconCheck } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { Json } from "@/types/database.types";
import { updateProfileAction } from "@/features/profile/actions";
import {
  parseAddress,
  serializeAddress,
  type AddressFormState,
} from "@/features/profile/address";
import { validateFullName, validatePhone } from "@/features/profile/validation";
import type { ProfileView } from "@/features/profile/types";

type FieldErrors = {
  fullName?: string;
  phoneNumber?: string;
};

export type PersonalDetailsFormProps = {
  view: ProfileView;
  /** Called after a successful save so the page can refresh its summary. */
  onSaved?: (values: { fullName: string; phoneNumber: string }) => void;
};

/**
 * Tab 1 — «المعلومات الشخصية».
 *
 * Edits the full name, the phone number and the address of the signed-in
 * administrator. The address is stored as `jsonb`; a free-text address is
 * serialised as `{ label }` while a structured address keeps its
 * city / street / zip shape.
 */
export function PersonalDetailsForm({ view, onSaved }: PersonalDetailsFormProps) {
  const [fullName, setFullName] = useState(view.fullName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(view.phoneNumber ?? "");
  const [address, setAddress] = useState<AddressFormState>(() =>
    parseAddress(view.address),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const toast = useToast();

  const switchAddressMode = (mode: AddressFormState["mode"]) => {
    setAddress((current) => {
      if (current.mode === mode) return current;

      if (mode === "structured") {
        // Free-text address → structured: the text is kept as the label.
        const preserved: Record<string, Json> = { ...(current.preserved ?? {}) };
        if (current.text.trim()) preserved.label = current.text.trim();

        return {
          mode: "structured",
          text: "",
          city: "",
          street: "",
          zip: "",
          preserved: Object.keys(preserved).length > 0 ? preserved : null,
        };
      }

      // Structured address → free text: the structured values are preserved.
      const preserved: Record<string, Json> = { ...(current.preserved ?? {}) };
      if (current.city.trim()) preserved.city = current.city.trim();
      if (current.street.trim()) preserved.street = current.street.trim();
      if (current.zip.trim()) preserved.zip = current.zip.trim();

      return {
        mode: "text",
        text: "",
        city: "",
        street: "",
        zip: "",
        preserved: Object.keys(preserved).length > 0 ? preserved : null,
      };
    });
    setSaved(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(false);

    const fullNameError = validateFullName(fullName);
    const phoneError = validatePhone(phoneNumber);

    setErrors({
      fullName: fullNameError ?? undefined,
      phoneNumber: phoneError ?? undefined,
    });

    if (fullNameError || phoneError) return;

    setSaving(true);

    try {
      const result = await updateProfileAction({
        fullName,
        phoneNumber,
        address: serializeAddress(address),
      });

      if (result.ok) {
        setSaved(true);
        toast.success(result.message);
        onSaved?.({ fullName: fullName.trim(), phoneNumber: phoneNumber.trim() });
      } else {
        toast.error("تعذّر حفظ التغييرات", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("تعذّر حفظ التغييرات:", error);
      toast.error("تعذّر حفظ التغييرات", {
        description: "حدث خطأ غير متوقع. حاول مرة أخرى.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="الاسم الكامل"
          required
          value={fullName}
          onChange={(event) => {
            setFullName(event.target.value);
            setSaved(false);
          }}
          error={errors.fullName}
          placeholder="مثال: ليلى حمدي"
          autoComplete="name"
        />

        <Input
          label="رقم الهاتف"
          type="tel"
          dir="ltr"
          value={phoneNumber}
          onChange={(event) => {
            setPhoneNumber(event.target.value);
            setSaved(false);
          }}
          error={errors.phoneNumber}
          hint="مثال: +49 176 1234567"
          placeholder="+49 176 1234567"
          autoComplete="tel"
          className="text-start"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="type-label text-foreground">العنوان</span>

          <div
            role="group"
            aria-label="نمط العنوان"
            className="inline-flex items-center gap-1 rounded-md bg-surface-secondary p-1"
          >
            <button
              type="button"
              onClick={() => switchAddressMode("text")}
              aria-pressed={address.mode === "text"}
              className={cn(
                "rounded-sm px-2.5 py-1 type-body-sm transition-colors duration-150",
                address.mode === "text"
                  ? "bg-surface font-semibold text-primary"
                  : "text-muted hover:text-foreground",
              )}
            >
              نصّي
            </button>
            <button
              type="button"
              onClick={() => switchAddressMode("structured")}
              aria-pressed={address.mode === "structured"}
              className={cn(
                "rounded-sm px-2.5 py-1 type-body-sm transition-colors duration-150",
                address.mode === "structured"
                  ? "bg-surface font-semibold text-primary"
                  : "text-muted hover:text-foreground",
              )}
            >
              مفصّل
            </button>
          </div>
        </div>

        {address.mode === "text" ? (
          <Textarea
            value={address.text}
            onChange={(event) => {
              setAddress((current) => ({
                ...current,
                text: event.target.value,
              }));
              setSaved(false);
            }}
            placeholder="الشارع، رقم المبنى، المدينة"
            hint="اكتب عنوانك كما تريد أن يظهر في السجلات."
            rows={3}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="المدينة"
              value={address.city}
              onChange={(event) => {
                setAddress((current) => ({
                  ...current,
                  city: event.target.value,
                }));
                setSaved(false);
              }}
              placeholder="برلين"
              autoComplete="address-level2"
            />

            <Input
              label="الشارع"
              value={address.street}
              onChange={(event) => {
                setAddress((current) => ({
                  ...current,
                  street: event.target.value,
                }));
                setSaved(false);
              }}
              placeholder="شارع كاونيتسبرغ"
              autoComplete="address-line1"
            />

            <Input
              label="الرمز البريدي"
              value={address.zip}
              onChange={(event) => {
                setAddress((current) => ({
                  ...current,
                  zip: event.target.value,
                }));
                setSaved(false);
              }}
              placeholder="10115"
              autoComplete="postal-code"
              className="sm:col-span-2"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button type="submit" loading={saving}>
            حفظ التغييرات
          </Button>

          {saved ? (
            <span className="inline-flex items-center gap-1.5 type-body-sm text-success">
              <IconCheck size={16} />
              تم الحفظ
            </span>
          ) : null}
        </div>

        <p className="type-body-sm text-subtle">
          تُحدَّث البيانات في حسابك الإداري فقط.
        </p>
      </div>
    </form>
  );
}

export default PersonalDetailsForm;
