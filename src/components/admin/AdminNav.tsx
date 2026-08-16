"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

export function AdminNav({
  active,
}: {
  active:
    | "products"
    | "content-submissions"
    | "analytics"
    | "sales"
    | "orders"
    | "users"
    | "invoices"
    | "returns"
    | "customers"
    | "accounting"
    | "purchases";
}) {
  const { t } = useLocale();
  const financeActive = active === "invoices" || active === "accounting" || active === "purchases";
  const customersActive = active === "users" || active === "customers";

  return (
    <div className="admin-header">
      <Link href="/" className="admin-back-link">
        <span className="admin-back-arrow">←</span> {t.admin.backToStore}
      </Link>
      <nav className="admin-nav">
        <Link href="/admin/products" className={active === "products" ? "active" : ""}>
          {t.admin.products}
        </Link>
        <Link href="/admin/analytics" className={active === "analytics" ? "active" : ""}>
          {t.admin.analytics}
        </Link>
        <Link href="/admin/sales" className={active === "sales" ? "active" : ""}>
          {t.admin.sales}
        </Link>
        <Link href="/admin/orders" className={active === "orders" ? "active" : ""}>
          {t.admin.orders}
        </Link>
        <Link href="/admin/returns" className={active === "returns" ? "active" : ""}>
          {t.admin.returns}
        </Link>

        <div className={`admin-nav-group${financeActive ? " active" : ""}`}>
          <span className="admin-nav-group-trigger" tabIndex={0}>
            {t.admin.navGroupFinance} <span className="caret">▾</span>
          </span>
          <div className="admin-nav-dropdown">
            <Link href="/admin/invoices" className={active === "invoices" ? "active" : ""}>
              {t.admin.invoices}
            </Link>
            <Link href="/admin/accounting" className={active === "accounting" ? "active" : ""}>
              {t.admin.accounting}
            </Link>
            <Link href="/admin/purchases" className={active === "purchases" ? "active" : ""}>
              {t.admin.purchases}
            </Link>
          </div>
        </div>

        <div className={`admin-nav-group${customersActive ? " active" : ""}`}>
          <span className="admin-nav-group-trigger" tabIndex={0}>
            {t.admin.navGroupCustomers} <span className="caret">▾</span>
          </span>
          <div className="admin-nav-dropdown">
            <Link href="/admin/users" className={active === "users" ? "active" : ""}>
              {t.admin.users}
            </Link>
            <Link href="/admin/customers" className={active === "customers" ? "active" : ""}>
              {t.admin.customers}
            </Link>
          </div>
        </div>

        <Link href="/admin/content-submissions" className={active === "content-submissions" ? "active" : ""}>
          {t.admin.contentSubmissions}
        </Link>
      </nav>
    </div>
  );
}
