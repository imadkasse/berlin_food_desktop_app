import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import type { ProfileRow } from "@/types/app";

export type UserAvatarProps = {
  profile: Pick<ProfileRow, "full_name" | "role"> | null | undefined;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
};

const ROLE_RING: Record<string, string> = {
  superadmin: "ring-primary/45",
  admin: "ring-info/45",
  manager: "ring-info/35",
  support: "ring-line",
  delivery: "ring-accent/45",
  customer: "ring-line",
};

/**
 * Profile avatar with a role-tinted ring, so the account type is readable at a
 * glance in dense tables.
 */
export function UserAvatar({ profile, size = "sm", className }: UserAvatarProps) {
  const role = profile?.role ?? "customer";

  return (
    <Avatar
      name={profile?.full_name ?? null}
      size={size}
      className={cn("ring-2", ROLE_RING[role] ?? "ring-line", className)}
    />
  );
}

export default UserAvatar;
