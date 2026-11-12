import { useId } from "react";
import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  error?: string;
  hint?: string;
  id?: string;
  className?: string;
  containerClassName?: string;
};

export function Input({
  label,
  error,
  hint,
  id,
  className,
  containerClassName,
  required,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={cn("flex w-full flex-col gap-1.5", containerClassName)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="type-label text-foreground"
        >
          {label}
          {required ? (
            <span className="ms-1 text-danger" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <input
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-11 w-full rounded-md bg-surface px-3 text-body-md text-foreground",
          "border border-line placeholder:text-subtle",
          "transition-colors duration-150",
          "focus:border-accent focus:outline-none",
          "disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-muted",
          error && "border-danger focus:border-danger",
          className,
        )}
        {...props}
      />

      {error ? (
        <p id={errorId} role="alert" className="type-body-sm text-danger">
          {error}
        </p>
      ) : null}

      {hint && !error ? (
        <p id={hintId} className="type-body-sm text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default Input;
