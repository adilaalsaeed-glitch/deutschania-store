import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
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

  const products = await prisma.product.findMany({
    select: { id: true, name: true, brand: true, domesticTaxRatePercent: true },
    orderBy: { brand: "asc" },
  });

  const productOptions = products.map((p) => {
    const name = p.name as Record<Locale, string>;
    return {
      id: p.id,
      nameAr: name.ar ?? p.brand,
      nameDe: name.de ?? p.brand,
      label: `${name[locale] ?? p.brand} — ${p.brand}`,
      domesticTaxRatePercent: p.domesticTaxRatePercent as 19 | 7 | null,
    };
  });

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <Link href="/admin/invoices" className="pp-breadcrumb">
          {t.admin.backToInvoices}
        </Link>
        <h1 className="auth-title">{t.admin.newManualInvoice}</h1>
        <ManualInvoiceForm products={productOptions} />
      </div>
    </div>
  );
}
