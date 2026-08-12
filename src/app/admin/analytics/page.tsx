import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { ProductIcon } from "@/components/shop/ProductIcon";
import { formatPriceCents } from "@/lib/currency";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getTotalRevenueCents, getTotalPaidOrders, getTopSellingProducts, getLowStockProducts } from "@/lib/analytics";

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);

  const [revenueCents, totalOrders, topSellers, lowStock] = await Promise.all([
    getTotalRevenueCents(),
    getTotalPaidOrders(),
    getTopSellingProducts(5),
    getLowStockProducts(),
  ]);

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <AdminNav active="analytics" />
        <h1 className="auth-title">{t.admin.analytics}</h1>

        <div className="analytics-stat-row">
          <div className="analytics-stat-card">
            <span className="analytics-stat-label">{t.admin.totalRevenue}</span>
            <span className="analytics-stat-value">{formatPriceCents(revenueCents, "EUR")}</span>
          </div>
          <div className="analytics-stat-card">
            <span className="analytics-stat-label">{t.admin.totalOrders}</span>
            <span className="analytics-stat-value">{totalOrders}</span>
          </div>
        </div>

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">{t.admin.topSellingProducts}</h2>
          {topSellers.length === 0 ? (
            <p className="admin-empty-note">{t.admin.noSalesYet}</p>
          ) : (
            <div className="analytics-list">
              {topSellers.map((p) => (
                <Link href={`/admin/products/${p.id}`} className="analytics-list-row" key={p.id}>
                  <div className="admin-thumb">
                    {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <ProductIcon icon={p.icon} />}
                  </div>
                  <div className="analytics-list-info">
                    <div className="admin-product-name">{p.name[locale]}</div>
                    <div className="admin-product-brand">{p.brand}</div>
                  </div>
                  <span className="analytics-list-metric">
                    {p.unitsSold} {t.admin.unitsSold}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">{t.admin.lowStockAlerts}</h2>
          {lowStock.length === 0 ? (
            <p className="admin-empty-note">{t.admin.noLowStock}</p>
          ) : (
            <div className="analytics-list">
              {lowStock.map((p) => (
                <Link href={`/admin/products/${p.id}`} className="analytics-list-row" key={p.id}>
                  <div className="admin-thumb">
                    {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <ProductIcon icon={p.icon} />}
                  </div>
                  <div className="analytics-list-info">
                    <div className="admin-product-name">{p.name[locale]}</div>
                    <div className="admin-product-brand">{p.brand}</div>
                  </div>
                  <span className={`admin-stock-badge${p.stockQuantity > 0 ? " in-stock" : " out-of-stock"}`}>
                    {p.stockQuantity > 0 ? `${t.admin.availableStatus} (${p.stockQuantity})` : t.admin.outOfStockStatus}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
