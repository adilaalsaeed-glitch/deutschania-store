import { prisma } from "@/lib/db";
import { StorefrontClient } from "@/components/StorefrontClient";
import type { ProductListItem } from "@/types/product";
import { isTestimonialsEnabled } from "@/lib/settings";
import { getApprovedTestimonials } from "@/lib/testimonials-data";
import { getTopSellingProducts } from "@/lib/analytics";

const HOMEPAGE_TESTIMONIALS_LIMIT = 6;
const NEW_ARRIVALS_LIMIT = 10;
const TOP_SELLERS_LIMIT = 10;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string; wish?: string }>;
}) {
  const params = await searchParams;
  const initialCategoryKey = params.cat ?? "all";
  const initialSearchQuery = params.q ?? "";
  const initialWishOnly = params.wish === "1";

  const testimonialsEnabled = await isTestimonialsEnabled();

  const [productsRaw, categories, testimonials, topSellers] = await Promise.all([
    prisma.product.findMany({
      where: { category: { archived: false } },
      select: {
        id: true,
        slug: true,
        brand: true,
        name: true,
        priceCents: true,
        currency: true,
        icon: true,
        imageUrl: true,
        sourceCountry: true,
        categoryKey: true,
        featured: true,
        stockQuantity: true,
        createdAt: true,
        category: { select: { key: true, label: true, icon: true, color: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.category.findMany({
      where: { archived: false },
      select: { key: true, label: true, icon: true, color: true },
      orderBy: { sortOrder: "asc" },
    }),
    testimonialsEnabled ? getApprovedTestimonials(HOMEPAGE_TESTIMONIALS_LIMIT) : Promise.resolve([]),
    getTopSellingProducts(TOP_SELLERS_LIMIT),
  ]);

  const products = productsRaw as unknown as ProductListItem[];
  const newArrivals = [...productsRaw]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, NEW_ARRIVALS_LIMIT) as unknown as ProductListItem[];
  const brands = Array.from(new Set(products.map((p) => p.brand))).sort((a, b) => a.localeCompare(b));
  const recommended = products.filter((p) => p.featured).slice(0, 10);

  return (
    <StorefrontClient
      // Forces a fresh component instance (and thus fresh local state) whenever the URL's
      // ?cat=/?q= change - Next.js reuses the same page instance across same-route
      // navigations (e.g. "/?cat=x" -> "/"), so state initialized from these params would
      // otherwise never reset on a plain client-side Link click back to "/".
      key={`${initialCategoryKey}:${initialSearchQuery}:${initialWishOnly}`}
      products={products}
      categories={categories as unknown as { key: string; label: ProductListItem["name"]; icon: string; color: string }[]}
      initialCategoryKey={initialCategoryKey}
      initialSearchQuery={initialSearchQuery}
      initialWishOnly={initialWishOnly}
      testimonials={testimonials}
      newArrivals={newArrivals}
      topSellers={topSellers}
      brands={brands}
      recommended={recommended}
    />
  );
}
