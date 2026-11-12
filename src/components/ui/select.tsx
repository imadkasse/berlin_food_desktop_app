import { useId } from "react";
import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/cn";
import { IconChevronDown } from "@/components/ui/icons";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  containerClassName?: string;
};

export function Select({
  label,
  error,
  hint,
  options,
  placeholder,
  id,
  className,
  containerClassName,
  required,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;
  const hintId = `${selectId}-hint`;

  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={cn("flex w-full flex-col gap-1.5", containerClassName)}>
      {label ? (
        <label htmlFor={selectId} className="type-label text-foreground">
          {label}
          {required ? (
            <span className="ms-1 text-danger" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div className="relative">
        <select
          id={selectId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-11 w-full appearance-none rounded-md bg-surface px-3 pe-9 text-body-md text-foreground",
            "border border-line transition-colors duration-150",
            "focus:border-accent focus:outline-none",
            "disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-muted",
            error && "border-danger focus:border-danger",
            className,
          )}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-subtle">
          <IconChevronDown size={16} />
        </span>
      </div>

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

export default Select;
