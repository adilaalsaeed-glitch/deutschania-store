"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useLocale } from "@/components/LocaleProvider";
import { ORDER_STATUS_ICONS, DASHBOARD_ORDER_STATUSES } from "@/lib/orderStatus";

// localStorage isn't available during SSR, so this section only ever renders client-side.
const RecentlyViewedSection = dynamic(
  () => import("@/components/account/RecentlyViewedSection").then((m) => m.RecentlyViewedSection),
  { ssr: false }
);

export function AccountDashboard({
  userName,
  statusCounts,
  totalOrders,
}: {
  userName: string;
  statusCounts: Record<string, number>;
  totalOrders: number;
}) {
  const { t } = useLocale();

  return (
    <div className="account-dashboard">
      <div className="account-welcome">
        <span className="account-welcome-prefix">{t.account.welcomePrefix}</span> {userName}
      </div>

      <div className="account-stat-row">
        <Link href="/account/points" className="account-stat-card">
          <span className="account-stat-icon">⭐</span>
          <span className="account-stat-label">{t.account.pointsCard}</span>
        </Link>
        <Link href="/account/coupons" className="account-stat-card">
          <span className="account-stat-icon">🎟</span>
          <span className="account-stat-label">{t.account.couponsCard}</span>
        </Link>
      </div>

      <div className="account-card">
        <h2 className="account-card-title">{t.account.myOrders}</h2>
        {totalOrders === 0 ? (
          <div className="account-empty">
            <p className="auth-sub">{t.account.noOrders}</p>
            <Link href="/" className="btn btn-brass" style={{ display: "inline-flex" }}>
              {t.account.startShopping}
            </Link>
          </div>
        ) : (
          <>
            <div className="order-status-row">
              {DASHBOARD_ORDER_STATUSES.map((status) => (
                <div className="order-status-item" key={status}>
                  <span className="order-status-icon">{ORDER_STATUS_ICONS[status]}</span>
                  <span className="order-status-count">{statusCounts[status] ?? 0}</span>
                  <span className="order-status-label">{t.account.orderStatus[status]}</span>
                </div>
              ))}
            </div>
            <Link href="/account/orders" className="btn btn-ghost-outline" style={{ display: "inline-flex", marginTop: 14 }}>
              {t.account.viewAllOrders}
            </Link>
          </>
        )}
      </div>

      <RecentlyViewedSection />
    </div>
  );
}
