"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { UserAvatar } from "@/components/dashboard/user-avatar";
import { ALL_NAV_ITEMS, isNavItemActive } from "@/components/dashboard/nav-config";
import { IconLogout } from "@/components/ui/icons";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/client";
import { useSessionStore } from "@/stores/session";
import type { ProfileRow } from "@/types/app";
import { cn } from "@/lib/cn";

export type SidebarProps = {
  /** Collapses the sidebar into an icon rail. */
  collapsed?: boolean;
  /** Server-rendered profile — takes precedence over the client store. */
  profile?: ProfileRow | null;
};

/** Bespoke Berlin Food mark — a stylised flame above a bowl. */
function BrandMark() {
  return (
    <svg
      viewBox="0 0 32 32"
      width="34"
      height="34"
      fill="none"
      aria-hidden="true"
      focusable="false"
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

export function Sidebar({ collapsed = false, profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const storeUser = useSessionStore((state) => state.user);
  const clearUser = useSessionStore((state) => state.clearUser);
  const [signingOut, setSigningOut] = useState(false);

  const user = profile ?? storeUser;
  const role = user?.role ?? null;
  const roleLabel = role ? ROLE_LABELS[role as keyof typeof ROLE_LABELS] : "—";
  const isSuperAdmin = role === "superadmin";

  const items = ALL_NAV_ITEMS.filter((item) => {
    if (!item.permission) return true;
    if (item.permission === "admins.manage") return isSuperAdmin;
    return true;
  });

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Signing out locally is enough to leave the dashboard.
    } finally {
      clearUser();
      setSigningOut(false);
      router.replace("/login");
      router.refresh();
    }
  };

  const showLabels = !collapsed;

  return (
    <aside
      aria-label="التنقل الرئيسي"
      className={cn(
        "sticky top-0 z-40 flex h-screen shrink-0 flex-col",
        "border-s border-line/70 bg-surface",
        collapsed ? "w-[72px]" : "w-[72px] lg:w-[260px]",
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-6 lg:px-6",
          collapsed ? "lg:px-4" : "",
        )}
      >
        <BrandMark />

        <div
          className={cn(
            "min-w-0 flex-col gap-0.5",
            showLabels ? "hidden lg:flex" : "hidden",
          )}
        >
          <span className="type-label tracking-[0.14em] text-foreground">
            BERLIN FOOD
          </span>
          <span className="type-body-sm text-subtle">لوحة إدارة المنصة</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="scrollbar-slim flex-1 overflow-y-auto px-3 pb-4 lg:px-4">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active = isNavItemActive(item, pathname);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  title={item.label}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5",
                    "type-body-md transition-colors duration-150",
                    active
                      ? "bg-accent-soft text-primary"
                      : "text-muted hover:bg-surface-secondary hover:text-foreground",
                  )}
                >
                  <span aria-hidden="true" className="shrink-0">
                    <Icon size={20} />
                  </span>
                  <span
                    className={cn(
                      "truncate",
                      showLabels ? "hidden lg:inline" : "hidden",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {isSuperAdmin ? (
          <p
            className={cn(
              "mt-6 px-3 type-body-sm text-subtle",
              showLabels ? "hidden lg:block" : "hidden",
            )}
          >
            إدارة المنصة
          </p>
        ) : null}
      </nav>

      {/* Account chip */}
      <div
        className={cn(
          "border-t border-line/70 p-3 lg:p-4",
          collapsed ? "lg:px-3" : "",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 rounded-md bg-surface-secondary p-2.5",
          )}
        >
          <UserAvatar profile={user} size="sm" />

          <div
            className={cn(
              "min-w-0 flex-1 flex-col gap-0.5",
              showLabels ? "hidden lg:flex" : "hidden",
            )}
          >
            <span className="truncate type-label text-foreground">
              {user?.full_name ?? "حساب المشرف"}
            </span>
            <span className="truncate type-body-sm text-subtle">{roleLabel}</span>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
              "text-muted transition-colors",
              "hover:bg-surface-hover hover:text-danger",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <IconLogout size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
