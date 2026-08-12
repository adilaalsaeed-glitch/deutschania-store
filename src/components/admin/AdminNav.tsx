"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

export function AdminNav({ active }: { active: "products" | "content-submissions" | "analytics" }) {
  const { t } = useLocale();
  return (
    <nav className="admin-nav">
      <Link href="/admin/products" className={active === "products" ? "active" : ""}>
        {t.admin.products}
      </Link>
      <Link href="/admin/analytics" className={active === "analytics" ? "active" : ""}>
        {t.admin.analytics}
      </Link>
      <Link href="/admin/content-submissions" className={active === "content-submissions" ? "active" : ""}>
        {t.admin.contentSubmissions}
      </Link>
    </nav>
  );
}
