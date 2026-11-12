"use client";

import { useMemo } from "react";

import { can, toRole } from "@/lib/auth/permissions";
import type { Permission } from "@/lib/auth/permissions";
import { useSessionStore } from "@/stores/session";

/**
 * Returns true when the signed-in admin holds `permission`.
 *
 * This is a UI affordance only — the authoritative check always happens on
 * the server through `assertPermission()`.
 */
export function usePermission(permission: Permission): boolean {
  const role = useSessionStore((state) => toRole(state.user?.role ?? null));

  return useMemo(() => can(role, permission), [role, permission]);
}

/** Returns true when the signed-in admin holds at least one of `permissions`. */
export function useAnyPermission(...permissions: Permission[]): boolean {
  const role = useSessionStore((state) => toRole(state.user?.role ?? null));
  const key = permissions.join("|");

  return useMemo(
    () => permissions.some((permission) => can(role, permission)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [role, key],
  );
}

export default usePermission;
