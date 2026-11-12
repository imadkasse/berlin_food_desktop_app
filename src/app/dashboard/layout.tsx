import { AppShell } from "@/components/dashboard/app-shell";
import { SessionHydrator } from "@/components/dashboard/session-hydrator";
import { requireSession } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <>
      <SessionHydrator profile={session.profile} />
      <AppShell profile={session.profile}>{children}</AppShell>
    </>
  );
}
