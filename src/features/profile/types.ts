import type { Role } from "@/lib/auth/permissions";
import type { Json } from "@/types/database.types";

/**
 * Berlin Food — Profile feature types.
 *
 * The `ProfileView` shape is the serialisable contract between the server
 * page (`src/app/dashboard/profile/page.tsx`) and every client component in
 * `src/features/profile/components`. It only carries plain data so it can be
 * safely passed across the React Server Component boundary.
 */

/** Result envelope returned by every profile server action. */
export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/** Result of the avatar upload action (adds the resolved public URL). */
export type AvatarActionResult =
  | { ok: true; message: string; url?: string }
  | { ok: false; error: string };

/** The signed-in administrator, as rendered on the profile page. */
export type ProfileView = {
  /** `auth.users.id` — always the current session user. */
  id: string;
  /** Account email (mirrors `auth.users.email`). */
  email: string | null;
  /** `profiles.full_name` */
  fullName: string | null;
  /** `profiles.phone_number` */
  phoneNumber: string | null;
  /** Normalised role of the profile (`null` when unknown). */
  role: Role | null;
  /** Raw `profiles.address` jsonb — may be a string or a structured object. */
  address: Json | null;
  /** `profiles.delivery_rating` */
  deliveryRating: number | null;
  /** `profiles.number_ratings` */
  numberRatings: number | null;
  /** `profiles.updated_at` */
  updatedAt: string | null;
  /** `auth.users.created_at` */
  createdAt: string | null;
  /** Public URL of the avatar in the `avatars` bucket — `null` when absent. */
  avatarUrl: string | null;
};

/** The four tabs of the profile page. */
export const PROFILE_TABS = [
  { value: "personal", label: "المعلومات الشخصية" },
  { value: "account", label: "تفاصيل الحساب" },
  { value: "password", label: "كلمة المرور" },
  { value: "appearance", label: "المظهر" },
] as const;

export type ProfileTab = (typeof PROFILE_TABS)[number]["value"];
