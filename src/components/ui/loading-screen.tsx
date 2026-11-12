"use client";

import { BrandMark } from "@/components/ui/brand-mark";
import { Spinner } from "@/components/ui/spinner";

/**
 * Full-screen, on-brand loading state for route-level suspense boundaries.
 *
 * Rendered inside the root layout (no dashboard chrome), it centers a gentle
 * breathing brand mark above a restrained indeterminate progress line.
 */
export function LoadingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen w-full flex-col items-center justify-center gap-8 overflow-hidden bg-background"
    >
      <span className="sr-only">جارٍ التحميل…</span>

      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          {/* Soft ambient glow behind the mark. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 m-auto h-40 w-40 rounded-full bg-accent-soft opacity-40 blur-3xl"
          />
          <div className="relative animate-brand-breathe">
            <BrandMark size={72} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <span className="type-label tracking-[0.16em] text-foreground">
            BERLIN FOOD
          </span>
          <span className="type-body-sm text-subtle">Urban Alchemist</span>
        </div>

        <div className="flex items-center gap-2.5">
          <Spinner size="lg" className="text-primary" />
          <span className="type-body-md text-muted">جارٍ التحميل…</span>
        </div>

        <div className="h-1 w-40 overflow-hidden rounded-full bg-surface-secondary">
          <div className="h-full w-1/2 animate-loading-sweep rounded-full bg-linear-to-r from-accent to-primary" />
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
