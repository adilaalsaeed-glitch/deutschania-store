import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { AccountingExportPanel } from "@/components/admin/AccountingExportPanel";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";

export default async function AdminAccountingPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <AdminNav active="accounting" />
        <h1 className="auth-title">{t.admin.accounting}</h1>
        <AccountingExportPanel />
      </div>
    </div>
  );
}
