"use client";

import { useEffect } from "react";

import { useSessionStore } from "@/stores/session";
import type { ProfileRow } from "@/types/app";

export type SessionHydratorProps = {
  profile: ProfileRow;
};

/**
 * Copies the server-rendered profile into the client session store so that
 * client components (sidebar, topbar, permission hooks) share one source of
 * truth.
 */
export function SessionHydrator({ profile }: SessionHydratorProps) {
  const setUser = useSessionStore((state) => state.setUser);

  useEffect(() => {
    setUser(profile);
  }, [profile, setUser]);

  return null;
}

export default SessionHydrator;
