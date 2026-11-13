"use client";

import { AppShell } from "@/components/dashboard/app-shell";
import { RequireAuth } from "@/lib/session";
import { useSessionStore } from "@/stores/session";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = useSessionStore((state) => state.user);

  return (
    <RequireAuth>
      <AppShell profile={profile}>{children}</AppShell>
    </RequireAuth>
  );
}
