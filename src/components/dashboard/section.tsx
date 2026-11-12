"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type SectionProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

/**
 * A titled block of content.
 *
 * Separation comes from spacing and a tonal background — never a 1px border
 * (the "No-Line Rule").
 */
export function Section({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: SectionProps) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="type-headline-sm text-foreground">{title}</h2>
          {description ? (
            <p className="type-body-md text-muted">{description}</p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>

      <div className={cn("rounded-lg bg-surface-secondary/60 p-4 sm:p-5", contentClassName)}>
        {children}
      </div>
    </section>
  );
}

export default Section;
