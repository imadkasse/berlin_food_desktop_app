import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import {
  DELIVERY_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  type DeliveryRequestStatus,
  type OrderStatus,
} from "@/types/app";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import type { Role } from "@/lib/auth/permissions";

const ORDER_VARIANTS: Record<OrderStatus, BadgeVariant> = {
  pending: "warning",
  preparing: "info",
  ready_for_pickup: "primary",
  out_for_delivery: "info",
  delivered: "success",
  cancelled: "danger",
};

const DELIVERY_VARIANTS: Record<DeliveryRequestStatus, BadgeVariant> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const ROLE_VARIANTS: Record<Role, BadgeVariant> = {
  superadmin: "primary",
  admin: "info",
  manager: "info",
  support: "neutral",
  delivery: "neutral",
  customer: "neutral",
};

export type StatusBadgeProps = {
  status: string;
  className?: string;
};

/**
 * Order status badge.
 *
 * The Arabic label is always rendered next to the colour so the status is
 * never conveyed by colour alone.
 */
export function OrderStatusBadge({
  status,
  className,
}: StatusBadgeProps) {
  const key = status as OrderStatus;
  const variant = ORDER_VARIANTS[key] ?? "neutral";
  const label = ORDER_STATUS_LABELS[key] ?? status;

  return (
    <Badge variant={variant} dot className={className}>
      {label}
    </Badge>
  );
}

/** Delivery-request status badge with the Arabic label. */
export function DeliveryStatusBadge({
  status,
  className,
}: StatusBadgeProps) {
  const key = status as DeliveryRequestStatus;
  const variant = DELIVERY_VARIANTS[key] ?? "neutral";
  const label = DELIVERY_STATUS_LABELS[key] ?? status;

  return (
    <Badge variant={variant} dot className={className}>
      {label}
    </Badge>
  );
}

/** Role badge with the Arabic role name. */
export function RoleBadge({
  role,
  className,
}: {
  role: string | null | undefined;
  className?: string;
}) {
  const key = (role ?? "") as Role;
  const variant = ROLE_VARIANTS[key] ?? "neutral";
  const label = ROLE_LABELS[key] ?? "غير معروف";

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
