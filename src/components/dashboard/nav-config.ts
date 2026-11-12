import type { ComponentType } from "react";

import {
  IconBike,
  IconHome,
  IconReceipt,
  IconShield,
  IconUser,
  IconUsers,
  IconUtensils,
} from "@/components/ui/icons";
import type { IconProps } from "@/components/ui/icons";
import type { Permission } from "@/lib/auth/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<IconProps>;
  /** When set, the entry is only rendered for roles holding this permission. */
  permission?: Permission;
  /** When true the item is only active on the exact path (no nested matching). */
  exact?: boolean;
};

/** Primary navigation — visible to every dashboard role. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "الرئيسية", icon: IconHome, exact: true },
  {
    href: "/dashboard/users",
    label: "المستخدمون",
    icon: IconUsers,
    permission: "users.read",
  },
  {
    href: "/dashboard/orders",
    label: "الطلبات",
    icon: IconReceipt,
    permission: "orders.read",
  },
  {
    href: "/dashboard/delivery-requests",
    label: "طلبات التوصيل",
    icon: IconBike,
    permission: "deliveries.read",
  },
  {
    href: "/dashboard/menu",
    label: "القائمة",
    icon: IconUtensils,
    permission: "menu.read",
  },
  {
    href: "/dashboard/profile",
    label: "الملف الشخصي",
    icon: IconUser,
    permission: "profile.read",
  },
];

/** Extra navigation reserved for superadmins. */
export const SUPERADMIN_NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/dashboard/admins",
    label: "المشرفون",
    icon: IconShield,
    permission: "admins.manage",
  },
];

/** Every navigation entry, in display order. */
export const ALL_NAV_ITEMS: readonly NavItem[] = [
  ...NAV_ITEMS,
  ...SUPERADMIN_NAV_ITEMS,
];

/** Returns true when `pathname` matches the nav item. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Returns the Arabic page title for a pathname (falls back to a generic title). */
export function getPageTitle(pathname: string): string {
  const match = ALL_NAV_ITEMS.find((item) => isNavItemActive(item, pathname));
  return match?.label ?? "لوحة التحكم";
}
