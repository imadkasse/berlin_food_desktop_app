import { cn } from "@/lib/cn";

export type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
};

const SIZE_CLASSES: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "h-4 w-4 border-[1.5px]",
  md: "h-6 w-6 border-2",
  lg: "h-9 w-9 border-[2.5px]",
};

export function Spinner({ size = "md", className, label = "جارٍ التحميل" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full",
        "border-current border-t-transparent opacity-70",
        SIZE_CLASSES[size],
        className,
      )}
    />
  );
}

export default Spinner;
