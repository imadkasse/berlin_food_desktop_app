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

      if (userError || !user) {
        clearUser();
        return;
      }

      const result = await invokeEdge<VerifySessionResponse>("verify-session");

      if (!result.ok) {
        console.error("Session verification failed:", result.error);
        clearUser();
        return;
      }

      setUser(result.profile);
    }

    void verify();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void verify();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, clearUser]);

  return <>{children}</>;
}

export default AuthProvider;
