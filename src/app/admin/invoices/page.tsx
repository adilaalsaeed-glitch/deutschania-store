import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminNav } from "@/components/admin/AdminNav";
import { formatPriceCents } from "@/lib/currency";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";

export default async function AdminInvoicesPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);

  const invoices = await prisma.invoice.findMany({
    orderBy: [{ year: "desc" }, { sequence: "desc" }],
    select: {
      id: true,
      invoiceNumber: true,
      source: true,
      issuedAt: true,
      buyerName: true,
      totalCents: true,
      pdfUrlAr: true,
      pdfUrlDe: true,
    },
  });

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <AdminNav active="invoices" />
        <div className="admin-page-head">
          <h1 className="auth-title">{t.admin.invoices}</h1>
          <Link href="/admin/invoices/new" className="btn btn-brass">
            + {t.admin.newManualInvoice}
          </Link>
        </div>

        {invoices.length === 0 ? (
          <p className="admin-empty-note">{t.admin.noInvoices}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t.admin.invoiceNumberCol}</th>
                <th>{t.admin.invoiceDateCol}</th>
                <th>{t.admin.invoiceBuyerCol}</th>
                <th>{t.admin.invoiceSourceCol}</th>
                <th>{t.admin.price}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td dir="ltr" style={{ textAlign: "start" }}>
                    {inv.invoiceNumber}
                  </td>
                  <td>{inv.issuedAt.toLocaleDateString(locale === "ar" ? "ar-EG" : "de-DE")}</td>
                  <td>{inv.buyerName}</td>
                  <td>
                    <span className={`invoice-source-badge ${inv.source.toLowerCase()}`}>
                      {inv.source === "AUTO" ? t.admin.invoiceSourceAuto : t.admin.invoiceSourceManual}
                    </span>
                  </td>
                  <td>{formatPriceCents(inv.totalCents, "EUR")}</td>
                  <td>
                    <div className="admin-row-actions">
                      {inv.pdfUrlAr ? (
                        <a href={inv.pdfUrlAr} target="_blank" rel="noreferrer" className="btn btn-ghost-outline">
                          {t.admin.downloadAr}
                        </a>
                      ) : (
                        <span className="admin-empty-note-inline">{t.admin.pdfPending}</span>
                      )}
                      {inv.pdfUrlDe && (
                        <a href={inv.pdfUrlDe} target="_blank" rel="noreferrer" className="btn btn-ghost-outline">
                          {t.admin.downloadDe}
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
