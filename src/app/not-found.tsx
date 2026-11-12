"use client";

import Link from "next/link";

import { BrandMark } from "@/components/ui/brand-mark";
import { IconHome, IconRefresh } from "@/components/ui/icons";

/**
 * Global 404 — rendered inside the root layout, full-screen, no dashboard
 * sidebar. Editorial and asymmetric, in keeping with the "Urban Alchemist"
 * identity.
 */
export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      {/* Ambient background — faint oversized watermark + soft radial glow. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-4 end-[-6%] select-none text-[clamp(12rem,30vw,26rem)] font-bold leading-none text-primary/5"
      >
        404
      </span>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute start-[12%] top-[62%] h-72 w-72 -translate-x-1/2 rounded-full bg-accent-soft opacity-30 blur-3xl"
      />

      <div className="animate-soft-rise relative flex flex-col items-center gap-6 text-center">
        <BrandMark size={56} />

        <h1 className="tabular text-[clamp(6rem,18vw,12rem)] font-bold leading-none text-primary">
          404
        </h1>
        <div
          aria-hidden="true"
          className="mx-auto h-1.5 w-16 rounded-full bg-accent"
        />

        <p className="type-headline-lg text-foreground">الصفحة غير موجودة</p>

        <p className="type-body-lg mx-auto max-w-md text-muted">
          يبدو أن الرابط الذي تحاول الوصول إليه غير صحيح، أو أن الصفحة نُقلت أو
          حُذفت. تحقّق من العنوان أو عُد إلى لوحة التحكم.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center gap-2.5 rounded-md bg-primary px-6 type-body-lg font-semibold text-[#FDF8F3] shadow-[0_1px_2px_rgba(43,33,27,0.12)] transition-colors hover:bg-primary-hover"
          >
            <IconHome size={18} />
            العودة إلى لوحة التحكم
          </Link>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-12 items-center justify-center gap-2.5 rounded-md bg-surface-secondary px-6 type-body-lg font-semibold text-foreground transition-colors hover:bg-surface-hover"
          >
            <IconRefresh size={18} />
            تحديث الصفحة
          </button>
        </div>
      </div>
    </main>
  );
}
