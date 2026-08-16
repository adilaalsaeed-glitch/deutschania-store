"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { formatPriceCents } from "@/lib/currency";
import { ORDER_STATUS_ICONS } from "@/lib/orderStatus";

type Row = {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  createdAt: string | Date;
  email: string;
  customerName: string;
  trackingNumber: string | null;
};

const STATUS_OPTIONS = ["PENDING", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "FAILED"] as const;

export function AdminOrdersList({ orders }: { orders: Row[] }) {
  const { t, locale } = useLocale();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (q) {
        const haystack = `${o.orderNumber} ${o.email} ${o.customerName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      const createdAt = new Date(o.createdAt);
      if (dateFrom && createdAt < new Date(dateFrom)) return false;
      if (dateTo && createdAt > new Date(`${dateTo}T23:59:59`)) return false;
      return true;
    });
  }, [orders, search, statusFilter, dateFrom, dateTo]);

  return (
    <>
      <h1 className="auth-title">{t.admin.orders}</h1>

      <div className="admin-filter-bar">
        <input
          type="text"
          className="admin-filter-search"
          placeholder={t.admin.ordersSearchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">{t.admin.allStatuses}</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {t.account.orderStatus[s as keyof typeof t.account.orderStatus] ?? s}
            </option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label={t.admin.ordersDateFrom} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label={t.admin.ordersDateTo} />
      </div>

      {filteredOrders.length === 0 ? (
        <p className="admin-empty-note">{t.admin.noOrdersFound}</p>
      ) : (
        <div className="analytics-list">
          {filteredOrders.map((o) => (
            <Link href={`/admin/orders/${o.id}`} className="analytics-list-row order-row" key={o.id}>
              <span className="order-row-icon">{ORDER_STATUS_ICONS[o.status] ?? "📦"}</span>
              <div className="analytics-list-info">
                <div className="admin-product-name" dir="ltr" style={{ textAlign: "start" }}>
                  {o.orderNumber}
                </div>
                <div className="admin-product-brand">
                  {o.customerName || o.email} · {new Date(o.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : locale)}
                  {o.trackingNumber ? ` · 📦 ${o.trackingNumber}` : ""}
                </div>
              </div>
              <span className="admin-product-brand">
                {t.account.orderStatus[o.status as keyof typeof t.account.orderStatus] ?? o.status}
              </span>
              <span className="analytics-list-metric">{formatPriceCents(o.totalCents, "EUR")}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
