import type { Json } from "@/types/database.types";
import type { OrderStatus } from "@/types/app";

/* -------------------------------------------------------------------------- */
/*                                   Filters                                  */
/* -------------------------------------------------------------------------- */

/** Value of the «الحالة» filter. */
export type OrderStatusFilter = "all" | OrderStatus;

/** Value of the «الفترة» filter. */
export type OrderPeriodFilter = "all" | "today" | "7d" | "30d";

/** Value of the «ترتيب» filter. */
export type OrderSortOption = "newest" | "oldest" | "highest";

/** The normalised filter state of the orders page. */
export type OrderFilters = {
  /** Free-text search: order reference, customer name or customer phone. */
  q: string;
  status: OrderStatusFilter;
  period: OrderPeriodFilter;
  sort: OrderSortOption;
  page: number;
  pageSize: number;
};

/* -------------------------------------------------------------------------- */
/*                                    Data                                    */
/* -------------------------------------------------------------------------- */

/** The customer snapshot embedded in the `order_info` view. */
export type OrderCustomerInfo = {
  id: string | null;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  address: Json | null;
};

/** One line of an order, as embedded in the `order_info.items` json column. */
export type OrderItemInfo = {
  id: string | null;
  quantity: number;
  /** Unit price **snapshot** taken when the order was placed. */
  unitPrice: number | null;
  name: string | null;
  menuItemId: string | null;
  imageUrl: string | null;
  /** The current menu price (may differ from the snapshot). */
  currentPrice: number | null;
};

/** A row of the orders table. */
export type OrderListRow = {
  id: string;
  totalPrice: number;
  status: string;
  createdAt: string | null;
  deliveryAddress: Json | null;
  customer: OrderCustomerInfo;
  items: OrderItemInfo[];
  /** Courier full name, `null` when the order has no courier yet. */
  courierName: string | null;
};

/** Aggregated counters shown in the KPI row. */
export type OrderStats = {
  /** Orders created since the start of today. */
  today: number;
  /** Orders currently being prepared. */
  preparing: number;
  /** Orders currently on the way to the customer. */
  outForDelivery: number;
  /** Orders delivered since the start of today. */
  deliveredToday: number;
};

/** The courier profile attached to an order, when one is assigned. */
export type OrderCourier = {
  id: string;
  fullName: string | null;
  phoneNumber: string | null;
  vehicleType: string | null;
  deliveryRating: number | null;
  numberRatings: number | null;
};

/** Everything the order detail page needs. */
export type OrderDetail = {
  id: string;
  totalPrice: number;
  status: string;
  createdAt: string | null;
  deliveryAddress: Json | null;
  customer: OrderCustomerInfo;
  items: OrderItemInfo[];
  /** Sum of `price × quantity` over all lines — **without** the delivery fee. */
  subtotal: number;
  /** `totalPrice - subtotal`. Zero when the order carries no delivery fee. */
  deliveryFee: number;
  courier: OrderCourier | null;
};

/* -------------------------------------------------------------------------- */
/*                              Server action results                        */
/* -------------------------------------------------------------------------- */

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };
