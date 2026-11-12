import type { ReactNode } from "react";

export type IconProps = {
  className?: string;
  size?: number;
};

type BaseIconProps = IconProps & {
  children: ReactNode;
  strokeWidth?: number;
};

/**
 * Shared shell for every icon in the set.
 *
 * Geometry is hand-drawn on a 24×24 grid with a 1.5 stroke so the set reads
 * as one family. Icons are decorative by default (`aria-hidden`), because the
 * surrounding control always carries its own Arabic label.
 */
function Svg({ children, className, size = 20, strokeWidth = 1.5 }: BaseIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconHome({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M3.4 10.7 12 3.6l8.6 7.1" />
      <path d="M5.7 9.3v9.5a1.3 1.3 0 0 0 1.3 1.3h10a1.3 1.3 0 0 0 1.3-1.3V9.3" />
      <path d="M9.7 20.1v-5.2a2.3 2.3 0 0 1 4.6 0v5.2" />
    </Svg>
  );
}

export function IconUsers({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M9.1 11.2a2.9 2.9 0 1 0 0-5.8 2.9 2.9 0 0 0 0 5.8Z" />
      <path d="M3.4 19.6c0-3.1 2.5-5.3 5.7-5.3s5.7 2.2 5.7 5.3" />
      <path d="M16.6 11.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z" />
      <path d="M15.9 14.7c2.5.3 4.7 2 4.7 4.9" />
    </Svg>
  );
}

export function IconReceipt({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M6.2 3.4h11.6v17.2l-2.3-1.4-2.3 1.4-2.3-1.4-2.3 1.4-2.4-1.4V3.4Z" />
      <path d="M9 8.2h6" />
      <path d="M9 11.8h6" />
      <path d="M9 15.4h3.6" />
    </Svg>
  );
}

export function IconBike({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M5.7 17.9a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Z" />
      <path d="M18.3 17.9a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Z" />
      <path d="M5.7 14.8 9.5 8.4h4.3l4.5 6" />
      <path d="M9.5 8.4 13.3 14.8H5.7" />
      <path d="M12.9 5.2h3.4" />
      <path d="M7.9 6.3h2.4" />
    </Svg>
  );
}

export function IconUtensils({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M7.2 3.4v5.7a1.85 1.85 0 0 0 3.7 0V3.4" />
      <path d="M9.05 9.4v11.2" />
      <path d="M16.6 3.4c-1.6 0-2.7 1.4-2.7 3.2s1.1 3.2 2.7 3.2 2.7-1.4 2.7-3.2-1.1-3.2-2.7-3.2Z" />
      <path d="M16.6 9.8v10.8" />
    </Svg>
  );
}

export function IconUser({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 12.3a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4Z" />
      <path d="M4.7 20.3c0-3.7 3.2-5.9 7.3-5.9s7.3 2.2 7.3 5.9" />
    </Svg>
  );
}

export function IconSearch({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M10.8 17.4a6.6 6.6 0 1 0 0-13.2 6.6 6.6 0 0 0 0 13.2Z" />
      <path d="m15.5 15.6 4.4 4.4" />
    </Svg>
  );
}

export function IconPlus({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 4.9v14.2" />
      <path d="M4.9 12h14.2" />
    </Svg>
  );
}

export function IconPencil({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="m16.1 3.9 4 4" />
      <path d="m4.1 20.1.9-4 10.6-10.6a1.75 1.75 0 0 1 2.5 0l.5.5a1.75 1.75 0 0 1 0 2.5L8 19.1l-3.9 1Z" />
    </Svg>
  );
}

export function IconTrash({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M4.6 6.6h14.8" />
      <path d="M9.4 6.6V5.1a1.5 1.5 0 0 1 1.5-1.5h2.2a1.5 1.5 0 0 1 1.5 1.5v1.5" />
      <path d="m6.4 6.6.9 12.1a1.7 1.7 0 0 0 1.7 1.6h6a1.7 1.7 0 0 0 1.7-1.6l.9-12.1" />
      <path d="M10.3 10.2v6.2" />
      <path d="M13.7 10.2v6.2" />
    </Svg>
  );
}

export function IconChevronDown({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="m6.5 9.4 5.5 5.6 5.5-5.6" />
    </Svg>
  );
}

export function IconChevronLeft({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="m14.5 6.4-5.6 5.6 5.6 5.6" />
    </Svg>
  );
}

export function IconChevronRight({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="m9.5 6.4 5.6 5.6-5.6 5.6" />
    </Svg>
  );
}

export function IconMoon({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M20.2 14.6A8.5 8.5 0 0 1 9.4 3.8a8.6 8.6 0 1 0 10.8 10.8Z" />
    </Svg>
  );
}

export function IconSun({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 16.3a4.3 4.3 0 1 0 0-8.6 4.3 4.3 0 0 0 0 8.6Z" />
      <path d="M12 2.9v2.1" />
      <path d="M12 19v2.1" />
      <path d="M2.9 12H5" />
      <path d="M19 12h2.1" />
      <path d="m5.6 5.6 1.5 1.5" />
      <path d="m16.9 16.9 1.5 1.5" />
      <path d="M18.4 5.6 16.9 7.1" />
      <path d="m7.1 16.9-1.5 1.5" />
    </Svg>
  );
}

export function IconBell({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M18.1 9.4a6.1 6.1 0 1 0-12.2 0c0 4.7-1.8 6.3-1.8 6.3h15.8s-1.8-1.6-1.8-6.3Z" />
      <path d="M13.8 19.1a2.1 2.1 0 0 1-3.6 0" />
    </Svg>
  );
}

export function IconLogout({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M9.7 20.4H6.2a2.2 2.2 0 0 1-2.2-2.2V5.8a2.2 2.2 0 0 1 2.2-2.2h3.5" />
      <path d="m15.4 16.4 4.4-4.4-4.4-4.4" />
      <path d="M19.8 12H9.4" />
    </Svg>
  );
}

export function IconClose({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="m5.9 5.9 12.2 12.2" />
      <path d="M18.1 5.9 5.9 18.1" />
    </Svg>
  );
}

export function IconCheck({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="m4.9 12.5 4.8 4.8L19.1 7" />
    </Svg>
  );
}

export function IconFilter({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M3.9 5.4h16.2l-6.3 7.4v6.1l-3.6 1.7v-7.8L3.9 5.4Z" />
    </Svg>
  );
}

export function IconUpload({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 16.3V4.5" />
      <path d="m7.4 9.1 4.6-4.6 4.6 4.6" />
      <path d="M4.4 15.1v3.5a1.7 1.7 0 0 0 1.7 1.7h11.8a1.7 1.7 0 0 0 1.7-1.7v-3.5" />
    </Svg>
  );
}

export function IconImage({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M4.7 5.6h14.6a1.5 1.5 0 0 1 1.5 1.5v9.8a1.5 1.5 0 0 1-1.5 1.5H4.7a1.5 1.5 0 0 1-1.5-1.5V7.1a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="m3.8 16.3 4.5-4.2 3.2 2.9 3-2.6 5.6 4.8" />
      <path d="M8.7 9.9a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z" />
    </Svg>
  );
}

export function IconPhone({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M8.1 4.4H5.3a1.9 1.9 0 0 0-1.9 2.1c0 8 6.4 14.4 14.4 14.4a1.9 1.9 0 0 0 2.1-1.9v-2.8l-4.3-1.3-1.6 2a13.1 13.1 0 0 1-6.6-6.6l2-1.6-1.3-4.3Z" />
    </Svg>
  );
}

export function IconMail({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M3.9 6.7h16.2v10.6a1.5 1.5 0 0 1-1.5 1.5H5.4a1.5 1.5 0 0 1-1.5-1.5V6.7Z" />
      <path d="m4.3 7.4 7.7 5.5 7.7-5.5" />
    </Svg>
  );
}

export function IconMapPin({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 21.1c4-4.5 6-7.5 6-10.1a6 6 0 1 0-12 0c0 2.6 2 5.6 6 10.1Z" />
      <path d="M12 13.3a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z" />
    </Svg>
  );
}

export function IconClock({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 20.4a8.4 8.4 0 1 0 0-16.8 8.4 8.4 0 0 0 0 16.8Z" />
      <path d="M12 7.3V12l3.3 2.1" />
    </Svg>
  );
}

export function IconStar({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="m12 3.7 2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 3.7Z" />
    </Svg>
  );
}

export function IconMoreVertical({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="12" cy="5.4" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.6" r="1.15" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconRefresh({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M20.1 12a8.1 8.1 0 1 1-2.4-5.8" />
      <path d="M20.3 4.3v4.5h-4.5" />
    </Svg>
  );
}

export function IconEye({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M2.8 12S6.4 6.3 12 6.3 21.2 12 21.2 12 17.6 17.7 12 17.7 2.8 12 2.8 12Z" />
      <path d="M12 14.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z" />
    </Svg>
  );
}

export function IconLock({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M5.9 10.6h12.2a1.5 1.5 0 0 1 1.5 1.5v6.5a1.5 1.5 0 0 1-1.5 1.5H5.9a1.5 1.5 0 0 1-1.5-1.5v-6.5a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M8.4 10.6V7.9a3.6 3.6 0 0 1 7.2 0v2.7" />
      <path d="M12 14.6v2.1" />
    </Svg>
  );
}

export function IconShield({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="m12 3.4 7 2.7v5.3c0 4.2-2.8 7.4-7 9.2-4.2-1.8-7-5-7-9.2V6.1l7-2.7Z" />
      <path d="m9.2 11.8 2.2 2.2 3.6-3.8" />
    </Svg>
  );
}

export function IconTruck({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M2.9 6.5h10.3v9.9H2.9V6.5Z" />
      <path d="M13.2 9.7h4l2.9 3.2v3.5h-6.9V9.7Z" />
      <path d="M7.3 18.9a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z" />
      <path d="M17.1 18.9a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z" />
    </Svg>
  );
}

export function IconPackage({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 3.6 20.2 8v8L12 20.4 3.8 16V8L12 3.6Z" />
      <path d="m3.8 8 8.2 4.4L20.2 8" />
      <path d="M12 12.4v8" />
    </Svg>
  );
}

export function IconAlert({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 4.1 21.3 19.5H2.7L12 4.1Z" />
      <path d="M12 10v4.3" />
      <path d="M12 16.7v.01" />
    </Svg>
  );
}

export function IconInfo({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 20.4a8.4 8.4 0 1 0 0-16.8 8.4 8.4 0 0 0 0 16.8Z" />
      <path d="M12 11.2v5.1" />
      <path d="M12 7.9v.01" />
    </Svg>
  );
}

export function IconArrowUp({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 19.4V4.9" />
      <path d="m5.9 11 6.1-6.1L18.1 11" />
    </Svg>
  );
}

export function IconArrowDown({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 4.6v14.5" />
      <path d="m18.1 13-6.1 6.1L5.9 13" />
    </Svg>
  );
}

export function IconCalendar({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M4.7 6.5h14.6v12.8a1.5 1.5 0 0 1-1.5 1.5H6.2a1.5 1.5 0 0 1-1.5-1.5V6.5Z" />
      <path d="M8.4 3.9v4" />
      <path d="M15.6 3.9v4" />
      <path d="M4.7 11.1h14.6" />
    </Svg>
  );
}

export function IconWallet({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M3.9 8.5a2.4 2.4 0 0 1 2.4-2.4h11.4a1.7 1.7 0 0 1 1.7 1.7v1.6" />
      <path d="M3.9 8.5v9a2 2 0 0 0 2 2h12.8a2 2 0 0 0 2-2v-6.5a1.6 1.6 0 0 0-1.6-1.6H5.9a2 2 0 0 1-2-2Z" />
      <path d="M16.5 14.1v.01" />
    </Svg>
  );
}

export function IconDashboard({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M3.9 4.6h7v6.7h-7V4.6Z" />
      <path d="M13.1 4.6h7v9.6h-7V4.6Z" />
      <path d="M3.9 13.4h7v6h-7v-6Z" />
      <path d="M13.1 16.5h7v2.9h-7v-2.9Z" />
    </Svg>
  );
}
