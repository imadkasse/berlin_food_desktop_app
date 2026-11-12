import {
  ORDER_STATUSES,
  type OrderStatus,
} from "@/types/app";
import type {
  OrderFilters,
  OrderPeriodFilter,
  OrderSortOption,
  OrderStatusFilter,
} from "@/features/orders/types";

/* -------------------------------------------------------------------------- */
/*                                Status guards                               */
/* -------------------------------------------------------------------------- */

/** `true` when `value` is one of the six order statuses. */
export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    (ORDER_STATUSES as readonly string[]).includes(value)
  );
}

/** `true` when `value` looks like a UUID. */
export function isOrderId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value.trim(),
    )
  );
}

/* -------------------------------------------------------------------------- */
/*                              Filter parsing                                */
/* -------------------------------------------------------------------------- */

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

const PERIODS = ["all", "today", "7d", "30d"] as const;
const SORTS = ["newest", "oldest", "highest"] as const;

/**
 * Normalises the raw URL search parameters of the page into the filter state
 * used by the data layer. Unknown or malformed values fall back to the default.
 */
export function parseOrderFilters(
  params: Record<string, string | string[] | undefined>,
  pageSize = 20,
): OrderFilters {
  const q = firstValue(params.q).trim().slice(0, 120);

  const statusRaw = firstValue(params.status);
  const status: OrderStatusFilter =
    statusRaw && isOrderStatus(statusRaw) ? statusRaw : "all";

  const periodRaw = firstValue(params.period);
  const period: OrderPeriodFilter = (
    PERIODS as readonly string[]
  ).includes(periodRaw)
    ? (periodRaw as OrderPeriodFilter)
    : "all";

  const sortRaw = firstValue(params.sort);
  const sort: OrderSortOption = (SORTS as readonly string[]).includes(sortRaw)
    ? (sortRaw as OrderSortOption)
    : "newest";

  const pageRaw = Number.parseInt(firstValue(params.page), 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return { q, status, period, sort, page, pageSize };
}
