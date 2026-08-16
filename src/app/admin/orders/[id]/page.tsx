import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminOrderStatusControl } from "@/components/admin/AdminOrderStatusControl";
import { allowedNextStatuses, type OrderStatusValue } from "@/lib/orderManagement";
import { formatPriceCents } from "@/lib/currency";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      invoice: { select: { id: true, invoiceNumber: true, pdfUrlAr: true, pdfUrlDe: true } },
    },
  });

  if (!order) {
    notFound();
  }

  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);

  const shipping = order.shippingAddress as {
    fullName?: string;
    address?: string;
    city?: string;
    postal?: string;
    country?: string;
    phone?: string;
  } | null;

  const nextStatuses = allowedNextStatuses(order.status as OrderStatusValue);
  const dateFmt = (d: Date) => d.toLocaleString(locale === "ar" ? "ar-EG" : locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <AdminNav active="orders" />
        <Link href="/admin/orders" className="pp-breadcrumb">
          {t.admin.orders}
        </Link>
        <h1 className="auth-title" dir="ltr" style={{ textAlign: "start" }}>
          {order.orderNumber}
        </h1>

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">{t.admin.ordersPaymentStatus}</h2>
          <dl className="legal-fields">
            <div className="legal-field-row">
              <dt>{t.admin.ordersStatusCol}</dt>
              <dd>{t.account.orderStatus[order.status as keyof typeof t.account.orderStatus] ?? order.status}</dd>
            </div>
            <div className="legal-field-row">
              <dt>{t.admin.ordersPlacedOn}</dt>
              <dd>{dateFmt(order.createdAt)}</dd>
            </div>
            {order.paidAt && (
              <div className="legal-field-row">
                <dt>{t.admin.ordersPaidOn}</dt>
                <dd>{dateFmt(order.paidAt)}</dd>
              </div>
            )}
            {order.preparingAt && (
              <div className="legal-field-row">
                <dt>{t.account.orderStatus.PREPARING}</dt>
                <dd>{dateFmt(order.preparingAt)}</dd>
              </div>
            )}
            {order.shippedAt && (
              <div className="legal-field-row">
                <dt>{t.account.orderStatus.SHIPPED}</dt>
                <dd>{dateFmt(order.shippedAt)}</dd>
              </div>
            )}
            {order.trackingNumber && (
              <div className="legal-field-row">
                <dt>{t.admin.ordersTrackingNumber}</dt>
                <dd dir="ltr">{order.trackingNumber}</dd>
              </div>
            )}
            {order.deliveredAt && (
              <div className="legal-field-row">
                <dt>{t.account.orderStatus.DELIVERED}</dt>
                <dd>{dateFmt(order.deliveredAt)}</dd>
              </div>
            )}
            {order.cancelledAt && (
              <div className="legal-field-row">
                <dt>{t.account.orderStatus.CANCELLED}</dt>
                <dd>{dateFmt(order.cancelledAt)}</dd>
              </div>
            )}
            {order.cancelReason && (
              <div className="legal-field-row">
                <dt>{t.admin.ordersCancelReason}</dt>
                <dd>{order.cancelReason}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">{t.admin.ordersStatusActionsTitle}</h2>
          <AdminOrderStatusControl orderId={order.id} allowedNext={nextStatuses} />
        </div>

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">{t.admin.invoiceBuyerCol}</h2>
          <dl className="legal-fields">
            <div className="legal-field-row">
              <dt>{t.admin.invoiceBuyerName}</dt>
              <dd>{shipping?.fullName || "—"}</dd>
            </div>
            <div className="legal-field-row">
              <dt>{t.auth.email}</dt>
              <dd dir="ltr">{order.email}</dd>
            </div>
            {shipping?.phone && (
              <div className="legal-field-row">
                <dt>{t.checkout.phone}</dt>
                <dd dir="ltr">{shipping.phone}</dd>
              </div>
            )}
            <div className="legal-field-row">
              <dt>{t.admin.invoiceBuyerAddress}</dt>
              <dd>
                {[shipping?.address, shipping?.city, shipping?.postal, shipping?.country].filter(Boolean).join(", ") || "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">{t.admin.invoiceLineItems}</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t.admin.description}</th>
                <th>{t.admin.quantity}</th>
                <th>{t.admin.price}</th>
                <th>{t.admin.total}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{(item.nameSnapshot as Record<Locale, string>)[locale] ?? (item.nameSnapshot as Record<Locale, string>).en}</td>
                  <td>{item.quantity}</td>
                  <td>{formatPriceCents(item.priceCentsAtSale, "EUR")}</td>
                  <td>{formatPriceCents(item.priceCentsAtSale * item.quantity, "EUR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="invoice-total-preview">
            {t.admin.total}: {formatPriceCents(order.totalCents, "EUR")}
          </div>
        </div>

        {order.invoice && (
          <div className="admin-form-section">
            <h2 className="admin-form-section-title">{t.admin.invoices}</h2>
            <div className="admin-row-actions" style={{ justifyContent: "flex-start" }}>
              {order.invoice.pdfUrlAr && (
                <a href={order.invoice.pdfUrlAr} target="_blank" rel="noreferrer" className="btn btn-ghost-outline">
                  {t.admin.downloadAr}
                </a>
              )}
              {order.invoice.pdfUrlDe && (
                <a href={order.invoice.pdfUrlDe} target="_blank" rel="noreferrer" className="btn btn-ghost-outline">
                  {t.admin.downloadDe}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
