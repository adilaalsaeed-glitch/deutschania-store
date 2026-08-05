import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { ProductDetailClient } from "@/components/shop/ProductDetailClient";
import type { ProductDetail, I18nText } from "@/types/product";

type CategoryOption = { key: string; label: I18nText; icon: string; color: string };

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    }),
    prisma.category.findMany({
      select: { key: true, label: true, icon: true, color: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!product) notFound();

  return (
    <SiteChrome categories={categories as unknown as CategoryOption[]}>
      <ProductDetailClient product={product as unknown as ProductDetail} />
    </SiteChrome>
  );
}
