"use client";

import { useMemo } from "react";

import { can, permissionsForRole, toRole } from "@/lib/auth/permissions";
import type { Permission, Role } from "@/lib/auth/permissions";
import { useSessionStore } from "@/stores/session";
import type { ProfileRow } from "@/types/app";

export type UseSessionResult = {
  user: ProfileRow | null;
  role: Role | null;
  permissions: ReadonlySet<Permission>;
  can: (permission: Permission) => boolean;
  setUser: (user: ProfileRow | null) => void;
  updateUser: (data: Partial<ProfileRow>) => void;
  clearUser: () => void;
};

/**
 * Exposes the signed-in admin profile together with the derived role,
 * the permission set and a `can()` helper.
 */
export function useSession(): UseSessionResult {
  const user = useSessionStore((state) => state.user);
  const setUser = useSessionStore((state) => state.setUser);
  const updateUser = useSessionStore((state) => state.updateUser);
  const clearUser = useSessionStore((state) => state.clearUser);

  const role = useMemo(() => toRole(user?.role ?? null), [user?.role]);

  const permissions = useMemo(() => permissionsForRole(role), [role]);

  return {
    user,
    role,
    permissions,
    can: (permission: Permission) => can(role, permission),
    setUser,
    updateUser,
    clearUser,
  };
}

export default useSession;
