import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { formatPriceCents } from "@/lib/currency";
import { getAvailableSalesYears, getYearMonthlyTotals, getYearProfitSummary } from "@/lib/salesReport";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";

export default async function AdminSalesPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);

  const years = await getAvailableSalesYears();
  const yearCards = await Promise.all(
    years.map(async (year) => {
      const [months, profitSummary] = await Promise.all([getYearMonthlyTotals(year), getYearProfitSummary(year)]);
      const revenueCents = months.reduce((sum, m) => sum + m.netTotalCents, 0);
      const hasProfitData = !(revenueCents > 0 && profitSummary.unattributedRevenueCents >= revenueCents);
      return { year, revenueCents, profitCents: profitSummary.profitCents, hasProfitData };
    })
  );

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <AdminNav active="sales" />
        <h1 className="auth-title">{t.admin.sales}</h1>

        {yearCards.length === 0 ? (
          <p className="admin-empty-note">{t.admin.noSalesDataYet}</p>
        ) : (
          <div className="sales-year-cards">
            {yearCards.map((c) => (
              <Link href={`/admin/sales/${c.year}`} className="sales-year-card" key={c.year}>
                <span className="sales-year-card-year" dir="ltr">
                  {c.year}
                </span>
                <div className="sales-year-card-metrics">
                  <div className="sales-year-card-metric">
                    <span className="sales-year-card-metric-label">{t.admin.salesYearTotal}</span>
                    <span className="sales-year-card-metric-value">{formatPriceCents(c.revenueCents, "EUR")}</span>
                  </div>
                  <div className="sales-year-card-metric">
                    <span className="sales-year-card-metric-label">{t.admin.salesProfit}</span>
                    <span className="sales-year-card-metric-value">
                      {c.hasProfitData ? formatPriceCents(c.profitCents, "EUR") : t.admin.salesCostDataUnavailableShort}
                    </span>
                  </div>
                </div>
                <span className="sales-year-card-arrow">›</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
