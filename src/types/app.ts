import type { Database } from "@/types/database.types";

export type {
  Permission,
  Role,
} from "@/lib/auth/permissions";

export {
  PERMISSIONS,
  PERMISSION_DENIAL_MESSAGES,
  PERMISSION_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_ORDER,
  ROLES,
  assignableRoles,
  can,
  canAccessDashboard,
  canAssignRole,
  canCreateRole,
  isPrivilegedRole,
  permissionsForRole,
  toRole,
} from "@/lib/auth/permissions";

/* -------------------------------------------------------------------------- */
/*                                 Database rows                               */
/* -------------------------------------------------------------------------- */

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
export type MenuItemRow = Database["public"]["Tables"]["menu_items"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type DeliveryRequestRow =
  Database["public"]["Tables"]["delivery_requests"]["Row"];

/* -------------------------------------------------------------------------- */
/*                                    Orders                                   */
/* -------------------------------------------------------------------------- */

export const ORDER_STATUSES = [
  "pending",
  "preparing",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "قيد الانتظار",
  preparing: "قيد التحضير",
  ready_for_pickup: "جاهز للاستلام",
  out_for_delivery: "في الطريق",
  delivered: "تم التسليم",
  cancelled: "ملغى",
};

/** Legacy status values kept for rows created before the migration. */
export const LEGACY_ORDER_STATUS_LABELS: Record<string, string> = {
  on_the_way: "في الطريق",
  ready: "جاهز للاستلام",
  confirmed: "قيد الانتظار",
  cooking: "قيد التحضير",
};

export function orderStatusLabel(status: string | null | undefined): string {
  if (!status) return "غير معروف";
  return (
    ORDER_STATUS_LABELS[status as OrderStatus] ??
    LEGACY_ORDER_STATUS_LABELS[status] ??
    status
  );
}

/* -------------------------------------------------------------------------- */
/*                             Delivery requests                              */
/* -------------------------------------------------------------------------- */

export const DELIVERY_STATUSES = ["pending", "approved", "rejected"] as const;

export type DeliveryRequestStatus = (typeof DELIVERY_STATUSES)[number];

export const DELIVERY_STATUS_LABELS: Record<DeliveryRequestStatus, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
};

export function deliveryStatusLabel(
  status: string | null | undefined,
): string {
  if (!status) return "غير معروف";
  return DELIVERY_STATUS_LABELS[status as DeliveryRequestStatus] ?? status;
}

/* -------------------------------------------------------------------------- */
/*                                 Vehicles                                    */
/* -------------------------------------------------------------------------- */

export const VEHICLE_LABELS: Record<string, string> = {
  bicycle: "دراجة هوائية",
  motorcycle: "دراجة نارية",
  car: "سيارة",
  van: "شاحنة صغيرة",
  foot: "سيرًا",
};

export function vehicleLabel(vehicle: string | null | undefined): string {
  if (!vehicle) return "—";
  return VEHICLE_LABELS[vehicle] ?? vehicle;
}

/* -------------------------------------------------------------------------- */
/*                                 Pagination                                  */
/* -------------------------------------------------------------------------- */

export type Paginated<T> = {
  rows: T[];
  count: number;
  page: number;
  pageSize: number;
};
