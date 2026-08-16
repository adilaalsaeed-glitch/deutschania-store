import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { formatPriceCents } from "@/lib/currency";
import {
  getYearMonthlyTotals,
  getYearProfitSummary,
  getYearMonthlyProfitTotals,
  getYearTotalRevenueCents,
  getAvailableSalesYears,
} from "@/lib/salesReport";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";

export default async function AdminSalesYearPage({ params }: { params: Promise<{ year: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const { year: yearParam } = await params;
  const year = Number(yearParam);
  if (!Number.isInteger(year)) {
    notFound();
  }

  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);

  const [months, profitSummary, monthlyProfits, availableYears] = await Promise.all([
    getYearMonthlyTotals(year),
    getYearProfitSummary(year),
    getYearMonthlyProfitTotals(year),
    getAvailableSalesYears(),
  ]);
  const yearTotalCents = months.reduce((sum, m) => sum + m.netTotalCents, 0);
  const activeMonths = months.filter((m) => m.orderCount > 0 || m.returnsCount > 0);
  const best = activeMonths.length ? activeMonths.reduce((a, b) => (b.netTotalCents > a.netTotalCents ? b : a)) : null;
  const worst =
    activeMonths.length > 1 ? activeMonths.reduce((a, b) => (b.netTotalCents < a.netTotalCents ? b : a)) : null;
  const onlyOneActiveMonth = activeMonths.length === 1;
  const noAttributableCostData = yearTotalCents > 0 && profitSummary.unattributedRevenueCents >= yearTotalCents;

  const monthsWithProfit = months.map((m, i) => ({ ...m, ...monthlyProfits[i] }));
  const maxAbsCents = Math.max(
    1,
    ...monthsWithProfit.flatMap((m) => [Math.abs(m.netTotalCents), m.hasProfitData ? Math.abs(m.profitCents) : 0])
  );

  const hasPrevYearData = availableYears.includes(year - 1);
  const prevYearTotalCents = hasPrevYearData ? await getYearTotalRevenueCents(year - 1) : null;
  const growthPercentVsPrevYear =
    prevYearTotalCents == null || prevYearTotalCents === 0
      ? null
      : ((yearTotalCents - prevYearTotalCents) / Math.abs(prevYearTotalCents)) * 100;
  const yearGrowthNegative = growthPercentVsPrevYear != null && growthPercentVsPrevYear < 0;

  const monthName = (m: number) =>
    new Date(2000, m - 1, 1).toLocaleDateString(locale === "ar" ? "ar-EG" : locale, { month: "short" });

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <AdminNav active="sales" />
        <Link href="/admin/sales" className="pp-breadcrumb">
          {t.admin.sales}
        </Link>
        <h1 className="auth-title" dir="ltr" style={{ textAlign: "start" }}>
          {year}
        </h1>

        <div className="analytics-stat-row">
          <div className="analytics-stat-card">
            <span className="analytics-stat-label">{t.admin.salesYearTotal}</span>
            <span className="analytics-stat-value">{formatPriceCents(yearTotalCents, "EUR")}</span>
          </div>
          <div className="analytics-stat-card">
            <span className="analytics-stat-label">{t.admin.salesGrowthVsPrevYear}</span>
            <span className={`analytics-stat-value${yearGrowthNegative ? " negative" : ""}`}>
              {growthPercentVsPrevYear != null
                ? `${growthPercentVsPrevYear > 0 ? "+" : ""}${growthPercentVsPrevYear.toFixed(1)}%`
                : "—"}
            </span>
          </div>
          {best && (
            <div className="analytics-stat-card">
              <span className="analytics-stat-label">{t.admin.salesBestMonth}</span>
              <span className="analytics-stat-value">
                {monthName(best.month)} · {formatPriceCents(best.netTotalCents, "EUR")}
              </span>
              {onlyOneActiveMonth && <p className="admin-empty-note-inline">{t.admin.salesOnlyActiveMonth}</p>}
            </div>
          )}
          {worst && (
            <div className="analytics-stat-card">
              <span className="analytics-stat-label">{t.admin.salesWorstMonth}</span>
              <span className="analytics-stat-value">
                {monthName(worst.month)} · {formatPriceCents(worst.netTotalCents, "EUR")}
              </span>
            </div>
          )}
        </div>

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">{t.admin.salesProfit}</h2>
          <div className="analytics-stat-row">
            <div className="analytics-stat-card">
              <span className="analytics-stat-label">{t.admin.salesCost}</span>
              <span className="analytics-stat-value">
                {noAttributableCostData ? "—" : formatPriceCents(profitSummary.costCents, "EUR")}
              </span>
            </div>
            <div className="analytics-stat-card">
              <span className="analytics-stat-label">{t.admin.salesProfit}</span>
              <span className="analytics-stat-value">
                {noAttributableCostData ? "—" : formatPriceCents(profitSummary.profitCents, "EUR")}
              </span>
            </div>
            <div className="analytics-stat-card">
              <span className="analytics-stat-label">{t.admin.salesMargin}</span>
              <span className="analytics-stat-value">
                {!noAttributableCostData && profitSummary.profitMarginPercent != null
                  ? `${profitSummary.profitMarginPercent.toFixed(1)}%`
                  : "—"}
              </span>
            </div>
          </div>
          {noAttributableCostData ? (
            <p className="form-note">{t.admin.salesNoAttributableCostData}</p>
          ) : (
            <>
              {profitSummary.unattributedRevenueCents > 0 && (
                <p className="form-note">
                  {t.admin.salesUnattributedRevenueNote.replace(
                    "{amount}",
                    formatPriceCents(profitSummary.unattributedRevenueCents, "EUR")
                  )}
                </p>
              )}
              {profitSummary.productsWithUnknownCostCount > 0 && (
                <p className="form-note">
                  {t.admin.salesUnknownCostNoteYear.replace("{count}", String(profitSummary.productsWithUnknownCostCount))}
                </p>
              )}
            </>
          )}
        </div>

        <div className="sales-chart-legend">
          <span className="sales-chart-legend-item">
            <span className="sales-chart-swatch revenue" />
            {t.admin.salesRevenue}
          </span>
          <span className="sales-chart-legend-item">
            <span className="sales-chart-swatch profit" />
            {t.admin.salesChartProfitLabel}
          </span>
          <span className="sales-chart-legend-item">
            <span className="sales-chart-swatch no-data" />
            {t.admin.salesCostDataUnavailableShort}
          </span>
        </div>

        <div className="sales-chart">
          {monthsWithProfit.map((m) => (
            <Link href={`/admin/sales/${year}/${m.month}`} className="sales-chart-bar-wrap" key={m.month}>
              <div className="sales-chart-bar-track">
                <div className="sales-chart-bar-pair">
                  <div
                    className={`sales-chart-bar revenue${m.netTotalCents < 0 ? " negative" : ""}`}
                    style={{ height: `${Math.max(2, (Math.abs(m.netTotalCents) / maxAbsCents) * 100)}%` }}
                    title={`${t.admin.salesRevenue}: ${formatPriceCents(m.netTotalCents, "EUR")}`}
                  />
                  {m.hasProfitData ? (
                    <div
                      className={`sales-chart-bar profit${m.profitCents < 0 ? " negative" : ""}`}
                      style={{ height: `${Math.max(2, (Math.abs(m.profitCents) / maxAbsCents) * 100)}%` }}
                      title={`${t.admin.salesChartProfitLabel}: ${formatPriceCents(m.profitCents, "EUR")}`}
                    />
                  ) : (
                    <div
                      className="sales-chart-bar profit no-data"
                      title={t.admin.salesCostDataUnavailableShort}
                    />
                  )}
                </div>
              </div>
              <span className="sales-chart-label">{monthName(m.month)}</span>
            </Link>
          ))}
        </div>

        <div className="analytics-list">
          {monthsWithProfit.map((m) => (
            <Link href={`/admin/sales/${year}/${m.month}`} className="analytics-list-row" key={m.month}>
              <div className="analytics-list-info">
                <div className="admin-product-name">{monthName(m.month)}</div>
                <div className="admin-product-brand">
                  {m.orderCount} {t.admin.salesOrderCount}
                  {m.returnsCount > 0 ? ` · ${m.returnsCount} ${t.admin.salesReturnsCount}` : ""}
                </div>
              </div>
              <div className="sales-list-metrics">
                <span className="analytics-list-metric">{formatPriceCents(m.netTotalCents, "EUR")}</span>
                <span className="sales-list-metric-secondary">
                  {t.admin.salesChartProfitLabel}: {m.hasProfitData ? formatPriceCents(m.profitCents, "EUR") : t.admin.salesCostDataUnavailableShort}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
