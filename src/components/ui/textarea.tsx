import { useId } from "react";
import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
  containerClassName?: string;
};

export function Textarea({
  label,
  error,
  hint,
  id,
  className,
  containerClassName,
  required,
  rows = 4,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = `${textareaId}-error`;
  const hintId = `${textareaId}-hint`;

  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={cn("flex w-full flex-col gap-1.5", containerClassName)}>
      {label ? (
        <label htmlFor={textareaId} className="type-label text-foreground">
          {label}
          {required ? (
            <span className="ms-1 text-danger" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <textarea
        id={textareaId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full resize-y rounded-md bg-surface px-3 py-2.5 text-body-md text-foreground",
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

export default Textarea;
