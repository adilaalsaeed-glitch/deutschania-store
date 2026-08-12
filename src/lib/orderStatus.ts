export const ORDER_STATUS_ICONS: Record<string, string> = {
  PENDING: "⏳",
  PAID: "📦",
  SHIPPED: "🚚",
  DELIVERED: "✅",
  CANCELLED: "✕",
  FAILED: "⚠",
};

// Shown as quick-glance icons on the account dashboard - FAILED is a checkout failure,
// not a meaningful "my orders" bucket customers browse, so it's excluded here.
export const DASHBOARD_ORDER_STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
