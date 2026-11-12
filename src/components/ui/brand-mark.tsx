export type BrandMarkProps = {
  size?: number;
  className?: string;
};

/**
 * Bespoke Berlin Food mark — a stylised flame above a bowl.
 *
 * Colours are bound to the theme tokens (`--accent`, `--primary`,
 * `--accent-soft`) so the mark adapts to light and dark modes automatically.
 */
export function BrandMark({ size = 44, className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M16 3.6c3.6 3.2 5.6 6 5.6 9.1 0 2.9-2.5 5-5.6 5s-5.6-2.1-5.6-5c0-3.1 2-5.9 5.6-9.1Z"
        fill="var(--accent)"
        opacity="0.9"
      />
      <path
        d="M6.4 19.4h19.2c0 4.2-3.6 7.6-8 7.6h-3.2c-4.4 0-8-3.4-8-7.6Z"
        fill="var(--primary)"
      />
      <path
        d="M11.2 21.6h9.6"
        stroke="var(--accent-soft)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default BrandMark;
