import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductMarginBox } from "@/components/admin/ProductMarginBox";
import { getLatestUnitCostCents } from "@/lib/productCost";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  const [product, categories, latestPurchase, unitCostCents] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      select: {
        slug: true,
        brand: true,
        name: true,
        description: true,
        priceCents: true,
        stockQuantity: true,
        imageUrl: true,
        sourceCountry: true,
        categoryKey: true,
        featured: true,
        attributes: true,
        domesticTaxRatePercent: true,
      },
    }),
    prisma.category.findMany({
      where: { archived: false },
      select: { key: true, label: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.purchase.findFirst({
      where: { productId: id },
      orderBy: { purchaseDate: "desc" },
      select: { purchaseDate: true },
    }),
    getLatestUnitCostCents(id),
  ]);

  if (!product) {
    notFound();
  }

  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);

  const initial = {
    slug: product.slug,
    brand: product.brand,
    name: product.name as { ar: string; de: string; en: string },
    description: (product.description as { ar: string; de: string; en: string } | null) ?? { ar: "", de: "", en: "" },
    priceCents: product.priceCents,
    stockQuantity: product.stockQuantity,
    imageUrl: product.imageUrl,
    sourceCountry: product.sourceCountry,
    categoryKey: product.categoryKey,
    featured: product.featured,
    attributes: (product.attributes as never) ?? { ar: [], de: [], en: [] },
    domesticTaxRatePercent: product.domesticTaxRatePercent as 19 | 7 | null,
  };

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <Link href="/admin/products" className="pp-breadcrumb">
          {t.admin.backToProducts}
        </Link>
        <h1 className="auth-title">{t.admin.editProduct}</h1>
        <ProductMarginBox
          t={t}
          locale={locale}
          priceCents={product.priceCents}
          unitCostCents={unitCostCents}
          costDate={latestPurchase?.purchaseDate ?? null}
        />
        <ProductForm mode="edit" productId={id} categories={categories as never} initial={initial} />
      </div>
    </div>
  );
}
