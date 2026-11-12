import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/spinner";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "outline";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-[#FDF8F3] hover:bg-primary-hover active:bg-primary-hover shadow-[0_1px_2px_rgba(43,33,27,0.12)]",
  secondary:
    "bg-surface-secondary text-foreground hover:bg-surface-hover active:bg-surface-hover",
  ghost: "bg-transparent text-muted hover:bg-surface-secondary hover:text-foreground",
  danger: "bg-danger text-[#FDF8F3] hover:brightness-95 active:brightness-95",
  outline:
    "bg-transparent text-foreground border border-line hover:bg-surface-secondary",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-body-sm gap-1.5 rounded-md",
  md: "h-11 px-4 text-body-md gap-2 rounded-md",
  lg: "h-12 px-6 text-body-lg gap-2.5 rounded-md",
  icon: "h-11 w-11 rounded-md",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  type = "button",
  icon,
  children,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap font-semibold",
        "transition-colors duration-150 select-none",
        "disabled:cursor-not-allowed disabled:opacity-55",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" className={variant === "primary" || variant === "danger" ? "text-current" : "text-muted"} />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

export default Button;
