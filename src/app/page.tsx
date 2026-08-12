import { prisma } from "@/lib/db";
import { StorefrontClient } from "@/components/StorefrontClient";
import type { ProductListItem } from "@/types/product";
import { isTestimonialsEnabled } from "@/lib/settings";
import { getApprovedTestimonials } from "@/lib/testimonials-data";

const HOMEPAGE_TESTIMONIALS_LIMIT = 6;

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

  const [products, categories, testimonials] = await Promise.all([
    prisma.product.findMany({
      select: {
        id: true,
        slug: true,
        brand: true,
        name: true,
        priceCents: true,
        currency: true,
        icon: true,
        imageUrl: true,
        origin: true,
        categoryKey: true,
        featured: true,
        category: { select: { key: true, label: true, icon: true, color: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.category.findMany({
      select: { key: true, label: true, icon: true, color: true },
      orderBy: { sortOrder: "asc" },
    }),
    testimonialsEnabled ? getApprovedTestimonials(HOMEPAGE_TESTIMONIALS_LIMIT) : Promise.resolve([]),
  ]);

  return (
    <StorefrontClient
      // Forces a fresh component instance (and thus fresh local state) whenever the URL's
      // ?cat=/?q= change - Next.js reuses the same page instance across same-route
      // navigations (e.g. "/?cat=x" -> "/"), so state initialized from these params would
      // otherwise never reset on a plain client-side Link click back to "/".
      key={`${initialCategoryKey}:${initialSearchQuery}:${initialWishOnly}`}
      products={products as unknown as ProductListItem[]}
      categories={categories as unknown as { key: string; label: ProductListItem["name"]; icon: string; color: string }[]}
      initialCategoryKey={initialCategoryKey}
      initialSearchQuery={initialSearchQuery}
      initialWishOnly={initialWishOnly}
      testimonials={testimonials}
    />
  );
}
