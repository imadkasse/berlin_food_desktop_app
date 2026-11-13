"use client";

import { can, toRole, type Permission, type Role } from "@/lib/auth/permissions";
import { useSessionStore, type SessionState } from "@/stores/session";

/**
 * Returns the current user's role (or `null` when not loaded / not signed in).
 */
export function useRole(): Role | null {
  return useSessionStore((state) => toRole(state.user?.role ?? null));
}

/**
 * Returns `true` when the current user holds the requested permission.
 */
export function useCan(permission: Permission): boolean {
  const role = useRole();
  return can(role, permission);
}

/**
 * Returns the full session store state.
 */
export function useSession(): SessionState {
  return useSessionStore();
}
