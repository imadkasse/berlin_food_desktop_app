import type {
  DeliveryRequestRow,
  DeliveryRequestStatus,
  OrderRow,
  ProfileRow,
} from "@/types/app";

/* -------------------------------------------------------------------------- */
/*                                   Filters                                  */
/* -------------------------------------------------------------------------- */

/** Value of the «الحالة» filter. */
export type DeliveryStatusFilter = "all" | DeliveryRequestStatus;

/** Value of the «الفترة» filter. */
export type DeliveryPeriodFilter = "all" | "today" | "7d" | "30d";

/** The normalised filter state of the delivery-requests page. */
export type DeliveryRequestFilters = {
  q: string;
  status: DeliveryStatusFilter;
  period: DeliveryPeriodFilter;
  page: number;
  pageSize: number;
};

/* -------------------------------------------------------------------------- */
/*                                Courier matching                            */
/* -------------------------------------------------------------------------- */

/**
 * Which field of the request produced the courier match.
 *
 * - `email` — the request email matched the account email (exact, case-insensitive).
 * - `phone`  — the request phone matched the account phone.
 */
export type CourierMatchSource = "email" | "phone";

export type CourierMatch = {
  /** The matched `profiles` row. */
  profile: ProfileRow;
  /** How the association was derived. */
  source: CourierMatchSource;
  /** `true` when the matched profile already carries the `delivery` role. */
  isCourier: boolean;
};

/* -------------------------------------------------------------------------- */
/*                                    Data                                    */
/* -------------------------------------------------------------------------- */

/** Aggregated counters shown in the KPI row. */
export type DeliveryStats = {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
};

/** Everything the detail panel needs about a single request. */
export type DeliveryRequestDetail = {
  request: DeliveryRequestRow;
  /**
   * The derived courier association.
   * `null` when no profile could be matched — the UI must say so honestly
   * instead of inventing a link.
   */
  match: CourierMatch | null;
  /** Orders assigned to the matched courier, newest first. */
  history: OrderRow[];
  /** Total number of orders assigned to the matched courier. */
  historyTotal: number;
};

/* -------------------------------------------------------------------------- */
/*                              Server action results                        */
/* -------------------------------------------------------------------------- */

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export type DetailResult =
  | { ok: true; detail: DeliveryRequestDetail }
  | { ok: false; error: string };
