"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconCheck, IconLogout, IconShield } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { cn } from "@/lib/cn";
import {
  changePassword,
  signOutAllDevices,
} from "@/features/profile/mutations";
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_HINT,
  validateCurrentPassword,
  validateNewPassword,
  validatePasswordConfirmation,
} from "@/features/profile/validation";

type FieldErrors = {
  current?: string;
  next?: string;
  confirm?: string;
};

type Strength = {
  score: 0 | 1 | 2 | 3;
  label: string;
};

/** A simple, honest strength estimate for the new password. */
function getStrength(password: string): Strength {
  if (!password) return { score: 0, label: "—" };

  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Za-z]/.test(password) && /\d/.test(password)) score += 1;

  const clamped = Math.min(score, 3) as 0 | 1 | 2 | 3;

  const labels: Record<0 | 1 | 2 | 3, string> = {
    0: "ضعيفة جدًا",
    1: "ضعيفة",
    2: "متوسطة",
    3: "قوية",
  };

  return { score: clamped, label: labels[clamped] };
}

/** Colour of the filled strength segments, per score. */
const STRENGTH_COLOR: Record<0 | 1 | 2 | 3, string> = {
  0: "bg-surface-secondary",
  1: "bg-danger",
  2: "bg-warning",
  3: "bg-success",
};

/**
 * Tab 3 — «كلمة المرور».
 *
 * The current password is verified by re-authenticating through the browser
 * auth SDK; the client only performs instant, non-authoritative validation.
 */
export function PasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const toast = useToast();

  const strength = getStrength(newPassword);
  const matches =
    confirmPassword.length > 0 && confirmPassword === newPassword;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const currentError = validateCurrentPassword(currentPassword);
    const nextError = validateNewPassword(currentPassword, newPassword);
    const confirmError = validatePasswordConfirmation(
      newPassword,
      confirmPassword,
    );

    setErrors({
      current: currentError ?? undefined,
      next: nextError ?? undefined,
      confirm: confirmError ?? undefined,
    });

    if (currentError || nextError || confirmError) return;

    setSubmitting(true);

    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (result.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setErrors({});
        toast.success(result.message);
      } else {
        toast.error("تعذّر تغيير كلمة المرور", {
          description: result.error,
        });
      }
    } catch {
      toast.error("تعذّر تغيير كلمة المرور", {
        description: "حدث خطأ غير متوقع. حاول مرة أخرى.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      const result = await signOutAllDevices();

      if (result.ok) {
        router.push("/login");
        return;
      }

      setSignOutOpen(false);
      toast.error("تعذّر تسجيل الخروج", {
        description: result.error,
      });
    } catch {
      setSignOutOpen(false);
      toast.error("تعذّر تسجيل الخروج", {
        description: "حدث خطأ غير متوقع. حاول مرة أخرى.",
      });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Input
          label="كلمة المرور الحالية"
          required
          type="password"
          dir="ltr"
          value={currentPassword}
          onChange={(event) => {
            setCurrentPassword(event.target.value);
            setErrors((current) => ({ ...current, current: undefined }));
          }}
          error={errors.current}
          placeholder="••••••••"
          autoComplete="current-password"
          className="text-start"
        />

        <div className="flex flex-col gap-2">
          <Input
            label="كلمة المرور الجديدة"
            required
            type="password"
            dir="ltr"
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              setErrors((current) => ({ ...current, next: undefined }));
            }}
            error={errors.next}
            hint={
              newPassword
                ? `${PASSWORD_HINT} · ${strength.label}`
                : PASSWORD_HINT
            }
            placeholder="••••••••"
            autoComplete="new-password"
            className="text-start"
          />

          <div
            aria-hidden="true"
            className="flex items-center gap-1.5"
          >
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors duration-150",
                  index < strength.score
                    ? STRENGTH_COLOR[strength.score]
                    : "bg-surface-secondary",
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            label="تأكيد كلمة المرور الجديدة"
            required
            type="password"
            dir="ltr"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setErrors((current) => ({ ...current, confirm: undefined }));
            }}
            error={errors.confirm}
            placeholder="••••••••"
            autoComplete="new-password"
            className="text-start"
          />

          {matches ? (
            <span className="inline-flex items-center gap-1.5 type-body-sm text-success">
              <IconCheck size={14} />
              كلمتا المرور متطابقتان
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={submitting} icon={<IconShield size={16} />}>
            تغيير كلمة المرور
          </Button>

          <p className="type-body-sm text-subtle">
            استخدم كلمة مرور لا تقل عن {MIN_PASSWORD_LENGTH} أحرف.
          </p>
        </div>
      </form>

      <div className="flex flex-col gap-3 rounded-lg bg-surface-secondary px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex flex-col gap-1">
          <span className="type-label text-foreground">
            تسجيل الخروج من جميع الأجهزة
          </span>
          <span className="type-body-sm text-subtle">
            أنهِ كل الجلسات المفتوحة على هذا الحساب، على هذا الجهاز وعلى بقية
            الأجهزة.
          </span>
        </div>

        <Button
          variant="secondary"
          icon={<IconLogout size={16} />}
          onClick={() => setSignOutOpen(true)}
          loading={signingOut}
          disabled={submitting}
        >
          تسجيل الخروج من جميع الأجهزة
        </Button>
      </div>

      <ConfirmDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        title="تسجيل الخروج من جميع الأجهزة"
        description="سيتم إنهاء كل الجلسات المفتوحة على هذا الحساب، وستحتاج إلى تسجيل الدخول مرة أخرى. هل تريد المتابعة؟"
        confirmLabel="تسجيل الخروج"
        cancelLabel="إلغاء"
        onConfirm={handleSignOut}
        tone="danger"
      />
    </div>
  );
}

export default PasswordForm;
