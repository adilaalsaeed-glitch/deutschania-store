import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      select: {
        slug: true,
        brand: true,
        name: true,
        description: true,
        priceCents: true,
        imageUrl: true,
        origin: true,
        categoryKey: true,
        featured: true,
        attributes: true,
      },
    }),
    prisma.category.findMany({ select: { key: true, label: true }, orderBy: { sortOrder: "asc" } }),
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
    imageUrl: product.imageUrl,
    origin: product.origin as "de" | "ar",
    categoryKey: product.categoryKey,
    featured: product.featured,
    attributes: (product.attributes as never) ?? { ar: [], de: [], en: [] },
  };

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <Link href="/admin/products" className="pp-breadcrumb">
          {t.admin.backToProducts}
        </Link>
        <h1 className="auth-title">{t.admin.editProduct}</h1>
        <ProductForm mode="edit" productId={id} categories={categories as never} initial={initial} />
      </div>
    </div>
  );
}
