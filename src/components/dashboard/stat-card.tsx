import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type StatCardTone = "default" | "success" | "warning" | "danger" | "info";

export type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: StatCardTone;
  className?: string;
};

const TONE_CLASSES: Record<StatCardTone, { chip: string; icon: string }> = {
  default: { chip: "bg-surface-secondary text-muted", icon: "text-primary" },
  success: { chip: "bg-success-soft text-success", icon: "text-success" },
  warning: { chip: "bg-warning-soft text-warning", icon: "text-warning" },
  danger: { chip: "bg-danger-soft text-danger", icon: "text-danger" },
  info: { chip: "bg-info-soft text-info", icon: "text-info" },
};

/**
 * A single KPI card.
 *
 * The metric is the hero (tabular numerals, no gradient), the Arabic label
 * sits directly underneath, and the tone only tints a small chip.
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  className,
}: StatCardProps) {
  const tones = TONE_CLASSES[tone];

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-lg bg-surface p-6",
        "border border-line/70",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="type-label text-muted">{label}</p>

        {icon ? (
          <span
            aria-hidden="true"
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              tones.chip,
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>

      <p className="type-metric tabular text-foreground">{value}</p>

      {hint ? <p className="type-body-sm text-subtle">{hint}</p> : null}
    </article>
  );
}

export default StatCard;
