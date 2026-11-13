export type DashboardStats = {
  /** Number of orders created since midnight. */
  todayOrders: number;
  /** Revenue of today's non-cancelled orders. */
  todayRevenue: number;
  /** Orders currently being prepared. */
  preparingOrders: number;
  /** Delivery agents flagged as available. */
  availableDeliveries: number;
};

export type RecentOrder = {
  id: string;
  customerId: string | null;
  customerName: string;
  totalPrice: number;
  status: string;
  createdAt: string | null;
};

export type RecentDeliveryRequest = {
  id: string;
  fullName: string;
  phoneNumber: string;
  status: string;
  createdAt: string;
};

export type TopMenuItem = {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
};
