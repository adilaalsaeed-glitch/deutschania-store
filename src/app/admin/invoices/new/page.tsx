import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { ManualInvoiceForm } from "@/components/admin/ManualInvoiceForm";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";

export default async function NewManualInvoicePage() {
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
        <Link href="/admin/invoices" className="pp-breadcrumb">
          {t.admin.backToInvoices}
        </Link>
        <h1 className="auth-title">{t.admin.newManualInvoice}</h1>
        <ManualInvoiceForm />
      </div>
    </div>
  );
}
