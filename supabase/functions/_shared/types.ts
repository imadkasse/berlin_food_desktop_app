/**
 * Berlin Food — Shared Edge Function types.
 *
 * These types mirror the frontend/app types but are kept self-contained so
 * the Deno Edge Functions never import from `src/`.
 */

export const ROLES = [
  "customer",
  "delivery",
  "admin",
  "manager",
  "support",
  "superadmin",
] as const;

export type Role = (typeof ROLES)[number];

export type Permission =
  | "users.read"
  | "users.write"
  | "users.delete"
  | "users.create.customer"
  | "users.create.delivery"
  | "users.create.privileged"
  | "orders.read"
  | "orders.write"
  | "orders.delete"
  | "deliveries.read"
  | "deliveries.write"
  | "menu.read"
  | "menu.write"
  | "categories.write"
  | "profile.read"
  | "profile.write"
  | "admins.manage"
  | "roles.manage";

/** Mirrors `src/types/app.ts` `ProfileRow` shape. */
export type Profile = {
  id: string;
  address: Record<string, unknown> | null;
  availability_status: boolean | null;
  delivery_rating: number | null;
  email: string | null;
  full_name: string | null;
  number_ratings: number | null;
  phone_number: string | null;
  role: string | null;
  updated_at: string | null;
  vehicle_type: string | null;
};
