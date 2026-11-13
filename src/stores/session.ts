import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ProfileRow } from "@/types/app";

export const SESSION_STORAGE_KEY = "bf-user";

export type SessionState = {
  /** The current admin's profile row. */
  user: ProfileRow | null;
  setUser: (user: ProfileRow | null) => void;
  updateUser: (data: Partial<ProfileRow>) => void;
  clearUser: () => void;
};

/**
 * Client-side session store.
 *
 * The store is hydrated by `AuthProvider` on mount via the `verify-session`
 * Edge Function so the persisted profile is always refreshed against the
 * server. Components that need the current admin should read from this store
 * or from the `useSession` / `useRole` / `useCan` hooks.
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
      clearUser: () => set({ user: null }),
    }),
    {
      name: SESSION_STORAGE_KEY,
    },
  ),
);
