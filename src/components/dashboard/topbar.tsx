"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { UserAvatar } from "@/components/dashboard/user-avatar";
import { getPageTitle } from "@/components/dashboard/nav-config";
import { DropdownMenu } from "@/components/ui/dropdown";
import {
  IconBell,
  IconChevronDown,
  IconLogout,
  IconMoon,
  IconSun,
  IconUser,
} from "@/components/ui/icons";
import { SearchInput } from "@/components/ui/search-input";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/client";
import { useSessionStore } from "@/stores/session";
import type { ProfileRow } from "@/types/app";
import { cn } from "@/lib/cn";

export type TopbarProps = {
  /** Collapses the sidebar into an icon rail. */
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  /** Server-rendered profile — takes precedence over the client store. */
  profile?: ProfileRow | null;
};

/**
 * Sticky contextual top bar: page title, global search, notifications,
 * theme switcher and the admin account menu.
 */
export function Topbar({
  onToggleSidebar,
  sidebarCollapsed = false,
  profile,
}: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const toast = useToast();

  const storeUser = useSessionStore((state) => state.user);
  const clearUser = useSessionStore((state) => state.clearUser);
  const user = profile ?? storeUser;

  const [search, setSearch] = useState("");

  // Keep the search field in sync with the route so it never shows a stale query.
  useEffect(() => {
    setSearch("");
  }, [pathname]);

  const title = getPageTitle(pathname);
  const roleLabel = user?.role
    ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]
    : "مشرف";

  const handleSearch = () => {
    const query = search.trim();
    if (!query) return;
    toast.info("البحث التفصيلي متاح داخل صفحة المستخدمين والطلبات.", {
      description: `كلمة البحث: «${query}»`,
    });
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Leaving the dashboard locally is enough.
    } finally {
      clearUser();
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-[72px] items-center gap-4",
        "border-b border-line/70 bg-surface/95 px-4 backdrop-blur-sm lg:px-6",
      )}
    >
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label={sidebarCollapsed ? "توسيع القائمة الجانبية" : "طيّ القائمة الجانبية"}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
          "text-muted transition-colors hover:bg-surface-secondary hover:text-foreground",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 7h16" />
          <path d="M4 12h10" />
          <path d="M4 17h16" />
        </svg>
      </button>

      <h1 className="type-headline-sm shrink-0 text-foreground">{title}</h1>

      <div className="ms-auto flex items-center gap-2">
        <form
          className="hidden w-64 md:block"
          onSubmit={(event) => {
            event.preventDefault();
            handleSearch();
          }}
        >
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="بحث في المنصة…"
            aria-label="البحث في المنصة"
          />
        </form>

        <button
          type="button"
          aria-label="الإشعارات"
          className={cn(
            "relative flex h-11 w-11 items-center justify-center rounded-md",
            "text-muted transition-colors hover:bg-surface-secondary hover:text-foreground",
          )}
        >
          <IconBell size={20} />
          <span
            aria-hidden="true"
            className="absolute end-2.5 top-2.5 h-2 w-2 rounded-full bg-accent"
          />
        </button>

        <button
          type="button"
          onClick={toggle}
          aria-label={theme === "dark" ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن"}
          title={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-md",
            "text-muted transition-colors hover:bg-surface-secondary hover:text-foreground",
          )}
        >
          {theme === "dark" ? <IconSun size={20} /> : <IconMoon size={20} />}
        </button>

        <DropdownMenu
          align="end"
          trigger={
            <span
              className={cn(
                "flex items-center gap-2.5 rounded-md py-1 ps-1 pe-2",
                "transition-colors hover:bg-surface-secondary",
              )}
            >
              <UserAvatar profile={user} size="sm" />
              <span className="hidden flex-col items-start gap-0 lg:flex">
                <span className="type-label leading-tight text-foreground">
                  {user?.full_name ?? "حساب المشرف"}
                </span>
                <span className="type-body-sm leading-tight text-subtle">
                  {roleLabel}
                </span>
              </span>
              <IconChevronDown size={16} className="hidden text-subtle lg:block" />
            </span>
          }
          items={[
            {
              label: "الملف الشخصي",
              icon: <IconUser size={16} />,
              onSelect: () => router.push("/dashboard/profile"),
            },
            {
              label: "تسجيل الخروج",
              icon: <IconLogout size={16} />,
              danger: true,
              onSelect: () => void handleSignOut(),
            },
          ]}
        />
      </div>
    </header>
  );
}

export default Topbar;
