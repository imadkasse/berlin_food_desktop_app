"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { canAccessDashboard, toRole } from "@/lib/auth/permissions";
import { useSessionStore } from "@/stores/session";

export type RequireAuthProps = {
  children: ReactNode;
};

/**
 * Client-side gate for the admin dashboard.
 *
 * Redirects to `/login` when there is no authenticated admin. The actual
 * access control must still be enforced by the backend / Edge Functions.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const user = useSessionStore((state) => state.user);
  const role = user ? toRole(user.role) : null;
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.replace("/login");
    } else if (!canAccessDashboard(role)) {
      router.replace("/login");
    }
  }, [user, role, router]);

  if (!user || !canAccessDashboard(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

export default RequireAuth;
