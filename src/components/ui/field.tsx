import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Wrapper that renders a label, an optional hint and an optional error message
 * around any form control.
 */
export function Field({
  label,
  error,
  hint,
  required = false,
  htmlFor,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="type-label text-foreground">
        {label}
        {required ? (
          <span className="ms-1 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {children}

      {error ? (
        <p role="alert" className="type-body-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="type-body-sm text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export default Field;
