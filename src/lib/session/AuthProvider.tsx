"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/client";
import { useSessionStore } from "@/stores/session";
import { invokeEdge } from "@/lib/api/edge";
import type { VerifySessionResponse } from "./types";

export type AuthProviderProps = {
  children: ReactNode;
};

/**
 * Keeps the client session store in sync with Supabase Auth.
 *
 * On mount (and on every auth state change) it verifies the session with the
 * `verify-session` Edge Function and updates the store. This guarantees that
 * persisted data is refreshed and that a stale / revoked session is detected.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const setUser = useSessionStore((state) => state.setUser);
  const clearUser = useSessionStore((state) => state.clearUser);

  useEffect(() => {
    const supabase = createClient();

    async function verify() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      let currentUser = user;

      // Network / token-refresh hiccups can make `getUser` fail even though a
      // valid persisted session exists. Fall back to the local session so a
      // refresh never logs the admin out.
      if (userError || !currentUser) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        currentUser = session?.user ?? null;
      }

      if (!currentUser) {
        clearUser();
        return;
      }

      const result = await invokeEdge<VerifySessionResponse>("verify-session");

      if (result.ok) {
        setUser(result.profile);
        return;
      }

      // The `verify-session` Edge Function may not be deployed yet. Fall back
      // to reading the admin's own profile; RLS restricts this to their row.
      console.error("Session verification failed:", result.error);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profile) {
        setUser(profile);
      } else {
        clearUser();
      }
    }

    void verify();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // Defer to avoid Supabase's auth-lock deadlock when calling into the
      // auth API from inside the callback.
      setTimeout(() => {
        void verify();
      }, 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, clearUser]);

  return <>{children}</>;
}

export default AuthProvider;
