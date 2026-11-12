import { cn } from "@/lib/cn";

export type SwitchProps = {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  id,
  className,
}: SwitchProps) {
  const labelId = id ? `${id}-label` : undefined;
  const descriptionId = id ? `${id}-description` : undefined;

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full",
          "transition-colors duration-200",
          "disabled:cursor-not-allowed disabled:opacity-55",
          checked ? "bg-primary" : "bg-surface-secondary",
        )}
      >
        <span
          aria-hidden="true"
          style={
            checked
              ? { insetInlineStart: "auto", insetInlineEnd: "2px" }
              : { insetInlineStart: "2px", insetInlineEnd: "auto" }
          }
          className={cn(
            "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-[#FDF8F3]",
            "shadow-[0_1px_2px_rgba(43,33,27,0.22)]",
            "transition-[inset-inline-start,inset-inline-end] duration-200",
          )}
        />
      </button>

      {label || description ? (
        <span className="flex flex-col gap-0.5">
          {label ? (
            <span
              id={labelId}
              className={cn(
                "type-label",
                disabled ? "text-subtle" : "text-foreground",
              )}
            >
              {label}
            </span>
          ) : null}
          {description ? (
            <span id={descriptionId} className="type-body-sm text-subtle">
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

export default Switch;
