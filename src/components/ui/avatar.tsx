import { cn } from "@/lib/cn";

export type AvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZE_CLASSES: Record<
  NonNullable<AvatarProps["size"]>,
  { box: string; text: string }
> = {
  xs: { box: "h-6 w-6", text: "text-[10px]" },
  sm: { box: "h-8 w-8", text: "text-xs" },
  md: { box: "h-10 w-10", text: "text-sm" },
  lg: { box: "h-12 w-12", text: "type-body-lg" },
  xl: { box: "h-16 w-16", text: "type-headline-sm" },
};

/** Builds up to two Arabic-safe initials from a display name. */
export function getInitials(name?: string | null): string {
  if (!name) return "؟";

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "؟";

  return parts.map((part) => part.charAt(0)).join("");
}

export function Avatar({
  src,
  name,
  size = "md",
  className,
}: AvatarProps) {
  const sizes = SIZE_CLASSES[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "صورة المستخدم"}
        className={cn(
          "shrink-0 rounded-full object-cover",
          "bg-surface-secondary ring-1 ring-line",
          sizes.box,
          className,
        )}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name ? `صورة ${name}` : "صورة المستخدم"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        "bg-accent-soft font-semibold text-primary",
        "ring-1 ring-line",
        sizes.box,
        sizes.text,
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}

export default Avatar;
