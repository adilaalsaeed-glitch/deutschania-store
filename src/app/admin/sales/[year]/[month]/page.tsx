import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { MonthlyExpensesPanel } from "@/components/admin/MonthlyExpensesPanel";
import { formatPriceCents } from "@/lib/currency";
import { getMonthDetail } from "@/lib/salesReport";
import { getMonthlyExpenses, getMonthlyExpensesTotalCents } from "@/lib/monthlyExpenses";
import { isSupportedCountry, countryName } from "@/data/countries";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";

export default async function AdminSalesMonthPage({ params }: { params: Promise<{ year: string; month: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const { year: yearParam, month: monthParam } = await params;
  const year = Number(yearParam);
  const month = Number(monthParam);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    notFound();
  }

  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);

  const [detail, expenses, expensesTotalCents] = await Promise.all([
    getMonthDetail(year, month),
    getMonthlyExpenses(year, month),
    getMonthlyExpensesTotalCents(year, month),
  ]);
  const monthName = new Date(2000, month - 1, 1).toLocaleDateString(locale === "ar" ? "ar-EG" : locale, { month: "long" });
  const growthNegative = detail.growthPercentVsPrevMonth != null && detail.growthPercentVsPrevMonth < 0;
  const noAttributableCostData = detail.netTotalCents > 0 && detail.unattributedRevenueCents >= detail.netTotalCents;
  const actualNetProfitCents = detail.profitCents - expensesTotalCents;

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <AdminNav active="sales" />
        <Link href={`/admin/sales/${year}`} className="pp-breadcrumb">
          {year}
        </Link>
        <h1 className="auth-title">
          {monthName} {year}
        </h1>

        <div className="analytics-stat-row">
          <div className="analytics-stat-card">
            <span className="analytics-stat-label">{t.admin.salesNetTotal}</span>
            <span className="analytics-stat-value">{formatPriceCents(detail.netTotalCents, "EUR")}</span>
          </div>
          <div className="analytics-stat-card">
            <span className="analytics-stat-label">{t.admin.salesOrderCount}</span>
            <span className="analytics-stat-value">{detail.orderCount}</span>
          </div>
          <div className="analytics-stat-card">
            <span className="analytics-stat-label">{t.admin.salesAvgOrderValue}</span>
            <span className="analytics-stat-value">
              {detail.avgOrderValueCents != null ? formatPriceCents(detail.avgOrderValueCents, "EUR") : "—"}
            </span>
          </div>
          <div className="analytics-stat-card">
            <span className="analytics-stat-label">{t.admin.salesGrowthVsPrevMonth}</span>
            <span className={`analytics-stat-value${growthNegative ? " negative" : ""}`}>
              {detail.growthPercentVsPrevMonth != null
                ? `${detail.growthPercentVsPrevMonth > 0 ? "+" : ""}${detail.growthPercentVsPrevMonth.toFixed(1)}%`
                : "—"}
            </span>
          </div>
        </div>

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">{t.admin.salesBreakdown}</h2>
          <dl className="legal-fields">
            <div className="legal-field-row">
              <dt>{t.admin.salesSubtotal}</dt>
              <dd>{formatPriceCents(detail.netSubtotalCents, "EUR")}</dd>
            </div>
            <div className="legal-field-row">
              <dt>{t.admin.salesTax}</dt>
              <dd>{formatPriceCents(detail.netTaxCents, "EUR")}</dd>
            </div>
            <div className="legal-field-row">
              <dt>{t.admin.total}</dt>
              <dd>{formatPriceCents(detail.netTotalCents, "EUR")}</dd>
            </div>
          </dl>
        </div>

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">{t.admin.salesReturns}</h2>
          {detail.returnsCount === 0 ? (
            <p className="admin-empty-note">{t.admin.salesNoReturns}</p>
          ) : (
            <p>
              {detail.returnsCount} {t.admin.salesReturnsCount} · {formatPriceCents(detail.returnsValueCents, "EUR")}
            </p>
          )}
        </div>

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">{t.admin.salesProfit}</h2>
          <div className="analytics-stat-row">
            <div className="analytics-stat-card">
              <span className="analytics-stat-label">{t.admin.salesCost}</span>
              <span className="analytics-stat-value">
                {noAttributableCostData ? "—" : formatPriceCents(detail.costCents, "EUR")}
              </span>
            </div>
            <div className="analytics-stat-card">
              <span className="analytics-stat-label">{t.admin.salesProfit}</span>
              <span className="analytics-stat-value">
                {noAttributableCostData ? "—" : formatPriceCents(detail.profitCents, "EUR")}
              </span>
            </div>
            <div className="analytics-stat-card">
              <span className="analytics-stat-label">{t.admin.salesMargin}</span>
              <span className="analytics-stat-value">
                {!noAttributableCostData && detail.profitMarginPercent != null
                  ? `${detail.profitMarginPercent.toFixed(1)}%`
                  : "—"}
              </span>
            </div>
          </div>
          {noAttributableCostData ? (
            <p className="form-note">{t.admin.salesNoAttributableCostData}</p>
          ) : (
            <>
              {detail.unattributedRevenueCents > 0 && (
                <p className="form-note">
                  {t.admin.salesUnattributedRevenueNote.replace(
                    "{amount}",
                    formatPriceCents(detail.unattributedRevenueCents, "EUR")
                  )}
                </p>
              )}
              {detail.productsWithUnknownCostCount > 0 && (
                <p className="form-note">
                  {t.admin.salesUnknownCostNote.replace("{count}", String(detail.productsWithUnknownCostCount))}
                </p>
              )}
            </>
          )}
        </div>

        <MonthlyExpensesPanel year={year} month={month} expenses={expenses} />

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">{t.admin.salesActualNetProfit}</h2>
          <div className="analytics-stat-value">
            {noAttributableCostData ? "—" : formatPriceCents(actualNetProfitCents, "EUR")}
          </div>
          <p className="form-note">{t.admin.salesActualNetProfitHint}</p>
        </div>

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">{t.admin.topSellingProducts}</h2>
          {detail.topProducts.length === 0 ? (
            <p className="admin-empty-note">{t.admin.noSalesYet}</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t.admin.productCol}</th>
                  <th>{t.admin.quantity}</th>
                  <th>{t.admin.salesRevenue}</th>
                  <th>{t.admin.purchaseCost}</th>
                </tr>
              </thead>
              <tbody>
                {detail.topProducts.map((p) => (
                  <tr key={p.productId}>
                    <td>{p.name[locale] ?? p.name.en}</td>
                    <td>{p.quantity}</td>
                    <td>{formatPriceCents(p.revenueCents, "EUR")}</td>
                    <td>{p.unitCostCents != null ? formatPriceCents(p.unitCostCents, "EUR") : t.admin.costNotRecorded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="admin-form-section">
          <h2 className="admin-form-section-title">{t.admin.salesByCountry}</h2>
          {detail.geoBreakdown.length === 0 ? (
            <p className="admin-empty-note">{t.admin.salesNoGeoData}</p>
          ) : (
            <div className="sales-geo-list">
              {detail.geoBreakdown.map((c) => {
                const displayCountry = isSupportedCountry(c.country) ? countryName(c.country, locale) : c.country;
                return (
                  <div className="sales-geo-country" key={c.country}>
                    <div className="sales-geo-country-header">
                      <span className="admin-product-name">{displayCountry}</span>
                      <span className="admin-product-brand">
                        {c.orderCount} {t.admin.salesOrderCount}
                      </span>
                      <span className="analytics-list-metric">{formatPriceCents(c.revenueCents, "EUR")}</span>
                    </div>
                    <div className="sales-geo-cities">
                      {c.cities.map((city) => (
                        <div className="sales-geo-city-row" key={city.city}>
                          <span>{city.city}</span>
                          <span className="admin-product-brand">
                            {city.orderCount} {t.admin.salesOrderCount}
                          </span>
                          <span>{formatPriceCents(city.revenueCents, "EUR")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
