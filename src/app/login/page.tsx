"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconAlert, IconCheck } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { useSessionStore } from "@/stores/session";

/** Bespoke Berlin Food mark — a stylised flame above a bowl. */
function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M16 3.6c3.6 3.2 5.6 6 5.6 9.1 0 2.9-2.5 5-5.6 5s-5.6-2.1-5.6-5c0-3.1 2-5.9 5.6-9.1Z"
        fill="var(--accent)"
        opacity="0.9"
      />
      <path
        d="M6.4 19.4h19.2c0 4.2-3.6 7.6-8 7.6h-3.2c-4.4 0-8-3.4-8-7.6Z"
        fill="var(--primary)"
      />
      <path
        d="M11.2 21.6h9.6"
        stroke="var(--accent-soft)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

type LoginFormProps = {
  nextPath: string | null;
  unauthorized: boolean;
};

function LoginForm({ nextPath, unauthorized }: LoginFormProps) {
  const router = useRouter();
  const setUser = useSessionStore((state) => state.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(
    unauthorized
      ? "هذا الحساب لا يملك صلاحية الوصول إلى لوحة الإدارة."
      : null,
  );
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = "يرجى إدخال البريد الإلكتروني.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "صيغة البريد الإلكتروني غير صحيحة.";
    }

    if (!password) {
      errors.password = "يرجى إدخال كلمة المرور.";
    } else if (password.length < 6) {
      errors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setFormError(mapAuthError(error.message));
        return;
      }

      if (!data.user) {
        setFormError("تعذّر تسجيل الدخول. حاول مرة أخرى.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profile) setUser(profile);

      router.push(nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard");
      router.refresh();
    } catch {
      setFormError("حدث خطأ غير متوقع أثناء تسجيل الدخول. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="type-headline-lg text-foreground">تسجيل الدخول</h1>
        <p className="type-body-lg text-muted">
          أدخل بيانات حسابك للوصول إلى لوحة إدارة المنصة.
        </p>
      </div>

      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md bg-danger-soft px-4 py-3 text-danger"
        >
          <span aria-hidden="true" className="mt-0.5 shrink-0">
            <IconAlert size={18} />
          </span>
          <p className="type-body-md">{formError}</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          type="email"
          name="email"
          label="البريد الإلكتروني"
          placeholder="name@example.com"
          autoComplete="email"
          dir="ltr"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
          required
        />

        <Input
          type="password"
          name="password"
          label="كلمة المرور"
          placeholder="••••••••"
          autoComplete="current-password"
          dir="ltr"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          required
        />

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}
        </Button>
      </form>
    </div>
  );
}

/** Maps a raw Supabase auth message to an Arabic one. */
function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  }
  if (normalized.includes("email not confirmed")) {
    return "لم يتم تأكيد البريد الإلكتروني بعد.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "محاولات كثيرة خلال وقت قصير. حاول مرة أخرى بعد قليل.";
  }
  if (normalized.includes("failed to fetch")) {
    return "تعذّر الاتصال بالخدمة. تحقّق من الاتصال بالإنترنت.";
  }

  return "تعذّر تسجيل الدخول. تحقّق من بياناتك وحاول مرة أخرى.";
}

/**
 * The part of the login screen that reads the query string.
 *
 * `useSearchParams()` forces a client-side render bailout, so it must live
 * inside a `<Suspense>` boundary.
 */
function LoginFormWithParams() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const unauthorized = searchParams.get("error") === "unauthorized";

  return <LoginForm nextPath={nextPath} unauthorized={unauthorized} />;
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Brand panel */}
        <section className="relative hidden flex-col justify-between bg-surface-secondary p-12 lg:flex">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div className="flex flex-col gap-0.5">
              <span className="type-label tracking-[0.16em] text-foreground">
                BERLIN FOOD
              </span>
              <span className="type-body-sm text-subtle">Urban Alchemist</span>
            </div>
          </div>

          <div className="flex max-w-md flex-col gap-4">
            <h2 className="type-display text-foreground">
              إدارة المنصة بدقّة، كما في المطبخ.
            </h2>
            <p className="type-body-lg text-muted">
              تابع الطلبات وطلبات التوصيل والقائمة والمستخدمين من مكان واحد —
              بإحصاءات واضحة وإجراءات محسوبة.
            </p>
          </div>

          <ul className="flex flex-col gap-2.5">
            {[
              "متابعة الطلبات لحظة بلحظة",
              "إدارة مندوبي التوصيل والموافقات",
              "تحكّم كامل في القائمة والأسعار",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2.5 type-body-md text-muted"
              >
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-primary"
                >
                  <IconCheck size={14} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Form panel */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <Suspense
            fallback={
              <div className="type-body-md text-muted">جارٍ التحميل…</div>
            }
          >
            <LoginFormWithParams />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
