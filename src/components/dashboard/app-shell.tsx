"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import type { ProfileRow } from "@/types/app";
import { cn } from "@/lib/cn";

export type AppShellProps = {
  children: ReactNode;
  /** Server-rendered profile of the signed-in admin. */
  profile?: ProfileRow | null;
};

/**
 * The dashboard chrome.
 *
 * In RTL the `<aside>` comes first inside the flex row so the sidebar lands
 * on the right. Only logical spacing utilities are used (`ms-`, `me-`, `ps-`,
 * `pe-`, `start-`, `end-`) so the layout mirrors correctly.
 */
export function AppShell({ children, profile }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={collapsed} profile={profile} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          sidebarCollapsed={collapsed}
          onToggleSidebar={() => setCollapsed((value) => !value)}
          profile={profile}
        />

        <main className={cn("flex-1 px-4 py-6 lg:px-8 lg:py-8")}>
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;
