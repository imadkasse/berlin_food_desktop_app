import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "primary";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children?: ReactNode;
  className?: string;
  /** Renders a small filled dot before the label. The label text is always present. */
  dot?: boolean;
};

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-surface-secondary text-muted",
  primary: "bg-accent-soft text-primary",
};

const DOT_CLASSES: Record<BadgeVariant, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-subtle",
  primary: "bg-primary",
};

export function Badge({
  variant = "neutral",
  children,
  className,
  dot = false,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "type-label whitespace-nowrap",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            DOT_CLASSES[variant],
          )}
        />
      ) : null}
      {children}
    </span>
  );
}

export default Badge;
