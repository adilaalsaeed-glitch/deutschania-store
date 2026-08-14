import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPriceCents } from "@/lib/currency";
import { ORDER_STATUS_ICONS } from "@/lib/orderStatus";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";

export default async function MyOrdersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalCents: true,
      createdAt: true,
      invoice: { select: { id: true, pdfUrlAr: true, pdfUrlDe: true } },
    },
  });

  return (
      <section className="cart-page">
        <div className="cart-page-inner">
          <nav className="pp-breadcrumb">
            <Link href="/account">{t.account.dashboardTitle}</Link>
          </nav>
          <h1 className="auth-title">{t.account.myOrders}</h1>

          {orders.length === 0 ? (
            <div className="account-empty">
              <p className="auth-sub">{t.account.noOrders}</p>
              <Link href="/" className="btn btn-brass" style={{ display: "inline-flex" }}>
                {t.account.startShopping}
              </Link>
            </div>
          ) : (
            <div className="analytics-list" style={{ marginTop: 20 }}>
              {orders.map((order) => (
                <div className="analytics-list-row order-row" key={order.id}>
                  <span className="order-row-icon">{ORDER_STATUS_ICONS[order.status] ?? "📦"}</span>
                  <div className="analytics-list-info">
                    <div className="admin-product-name" dir="ltr" style={{ textAlign: "start" }}>
                      {order.orderNumber}
                    </div>
                    <div className="admin-product-brand">
                      {order.createdAt.toLocaleDateString(locale === "ar" ? "ar-EG" : locale)} ·{" "}
                      {t.account.orderStatus[order.status as keyof typeof t.account.orderStatus] ?? order.status}
                    </div>
                  </div>
                  <span className="analytics-list-metric">{formatPriceCents(order.totalCents, "EUR")}</span>
                  <div className="admin-row-actions">
                    {order.invoice ? (
                      <>
                        <a
                          href={`/api/account/invoices/${order.invoice.id}/download?lang=ar`}
                          className="btn btn-ghost-outline"
                        >
                          {t.admin.downloadAr}
                        </a>
                        <a
                          href={`/api/account/invoices/${order.invoice.id}/download?lang=de`}
                          className="btn btn-ghost-outline"
                        >
                          {t.admin.downloadDe}
                        </a>
                      </>
                    ) : (
                      <span className="admin-empty-note-inline">{t.account.invoiceNotAvailable}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
  );
}
