import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";

export default async function NewProductPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const categories = await prisma.category.findMany({
    select: { key: true, label: true },
    orderBy: { sortOrder: "asc" },
  });

  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <Link href="/admin/products" className="pp-breadcrumb">
          {t.admin.backToProducts}
        </Link>
        <h1 className="auth-title">{t.admin.addProduct}</h1>
        <ProductForm mode="create" categories={categories as never} />
      </div>
    </div>
  );
}
