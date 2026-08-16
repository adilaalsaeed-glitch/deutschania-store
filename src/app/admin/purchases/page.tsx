import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminPurchasesPanel } from "@/components/admin/AdminPurchasesPanel";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

export default async function AdminPurchasesPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  const [purchases, products] = await Promise.all([
    prisma.purchase.findMany({ orderBy: { purchaseDate: "desc" } }),
    prisma.product.findMany({ select: { id: true, name: true, brand: true }, orderBy: { brand: "asc" } }),
  ]);

  const productOptions = products.map((p) => ({
    id: p.id,
    label: `${(p.name as Record<Locale, string>)[locale] ?? p.brand} — ${p.brand}`,
  }));

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <AdminNav active="purchases" />
        <AdminPurchasesPanel purchases={purchases as never} products={productOptions} />
      </div>
    </div>
  );
}
