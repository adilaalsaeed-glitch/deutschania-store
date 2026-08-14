"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

export function AdminNav({
  active,
}: {
  active: "products" | "content-submissions" | "analytics" | "invoices";
}) {
  const { t } = useLocale();
  return (
    <>
      <Link href="/" className="admin-back-link">
        ← {t.admin.backToStore}
      </Link>
      <nav className="admin-nav">
        <Link href="/admin/products" className={active === "products" ? "active" : ""}>
          {t.admin.products}
        </Link>
        <Link href="/admin/analytics" className={active === "analytics" ? "active" : ""}>
          {t.admin.analytics}
        </Link>
        <Link href="/admin/invoices" className={active === "invoices" ? "active" : ""}>
          {t.admin.invoices}
        </Link>
        <Link href="/admin/content-submissions" className={active === "content-submissions" ? "active" : ""}>
          {t.admin.contentSubmissions}
        </Link>
      </nav>
    </>
  );
}
