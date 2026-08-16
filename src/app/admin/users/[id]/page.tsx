import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminUserSuspendControl } from "@/components/admin/AdminUserSuspendControl";
import { ORDER_STATUS_ICONS } from "@/lib/orderStatus";
import { formatPriceCents } from "@/lib/currency";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      createdAt: true,
      loyaltyPoints: true,
      suspended: true,
      suspendedAt: true,
      suspendedReason: true,
      role: true,
      orders: {
        orderBy: { createdAt: "desc" },
        select: { id: true, orderNumber: true, status: true, totalCents: true, createdAt: true },
      },
    },
  });

  if (!user || user.role !== "CUSTOMER") {
    notFound();
  }

  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <AdminNav active="users" />
        <Link href="/admin/users" className="pp-breadcrumb">
          {t.admin.users}
        </Link>
        <h1 className="auth-title">
          {user.firstName} {user.lastName}
        </h1>

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">{t.admin.usersProfile}</h2>
          <dl className="legal-fields">
            <div className="legal-field-row">
              <dt>{t.auth.email}</dt>
              <dd dir="ltr">{user.email}</dd>
            </div>
            {user.phone && (
              <div className="legal-field-row">
                <dt>{t.checkout.phone}</dt>
                <dd dir="ltr">{user.phone}</dd>
              </div>
            )}
            <div className="legal-field-row">
              <dt>{t.admin.usersRegisteredCol}</dt>
              <dd>{user.createdAt.toLocaleDateString(locale === "ar" ? "ar-EG" : locale)}</dd>
            </div>
            <div className="legal-field-row">
              <dt>{t.loyalty.balanceLabel}</dt>
              <dd>{user.loyaltyPoints}</dd>
            </div>
            {user.suspended && user.suspendedAt && (
              <div className="legal-field-row">
                <dt>{t.admin.usersSuspendedOn}</dt>
                <dd>{user.suspendedAt.toLocaleDateString(locale === "ar" ? "ar-EG" : locale)}</dd>
              </div>
            )}
            {user.suspended && user.suspendedReason && (
              <div className="legal-field-row">
                <dt>{t.admin.usersSuspendReason}</dt>
                <dd>{user.suspendedReason}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">{t.admin.usersAccountStatus}</h2>
          <AdminUserSuspendControl userId={id} suspended={user.suspended} />
        </div>

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">{t.admin.orders}</h2>
          {user.orders.length === 0 ? (
            <p className="admin-empty-note">{t.account.noOrders}</p>
          ) : (
            <div className="analytics-list">
              {user.orders.map((o) => (
                <Link href={`/admin/orders/${o.id}`} className="analytics-list-row order-row" key={o.id}>
                  <span className="order-row-icon">{ORDER_STATUS_ICONS[o.status] ?? "📦"}</span>
                  <div className="analytics-list-info">
                    <div className="admin-product-name" dir="ltr" style={{ textAlign: "start" }}>
                      {o.orderNumber}
                    </div>
                    <div className="admin-product-brand">
                      {o.createdAt.toLocaleDateString(locale === "ar" ? "ar-EG" : locale)} ·{" "}
                      {t.account.orderStatus[o.status as keyof typeof t.account.orderStatus] ?? o.status}
                    </div>
                  </div>
                  <span className="analytics-list-metric">{formatPriceCents(o.totalCents, "EUR")}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
