import type { Role, Permission } from "@/lib/auth/permissions";
import type { ProfileRow } from "@/types/app";

export type VerifiedSession = {
  userId: string;
  role: Role | null;
  permissions: Permission[];
  profile: ProfileRow | null;
};

export type VerifySessionResponse =
  | {
      ok: true;
      userId: string;
      role: Role;
      permissions: Permission[];
      profile: ProfileRow;
    }
  | { ok: false; error: string };
