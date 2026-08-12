"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { getRecentlyViewed, type RecentlyViewedProduct } from "@/lib/recentlyViewed";
import { formatPriceCents } from "@/lib/currency";
import { ProductIcon } from "@/components/shop/ProductIcon";

// Only ever mounted client-side (see the dynamic import with ssr:false in
// StorefrontClient.tsx), so reading localStorage here can't cause a hydration mismatch.
// Hidden entirely when empty - unlike the account dashboard's equivalent section, an empty
// "recently viewed" box on a marketing homepage (e.g. a first-time visitor) looks broken.
export function HomeRecentlyViewed() {
  const { locale, t } = useLocale();
  const [items] = useState<RecentlyViewedProduct[]>(() => getRecentlyViewed());

  if (items.length === 0) return null;

  return (
    <section className="section">
      <div className="section-inner">
        <div className="section-head">
          <span className="eyebrow">{t.home.recentlyViewedEyebrow}</span>
          <h2 className="display">{t.home.recentlyViewedTitle}</h2>
        </div>
        <div className="recently-viewed-row">
          {items.map((p) => (
            <Link href={`/product/${p.slug}`} key={p.id} className="recently-viewed-item">
              <div className="recently-viewed-media">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name[locale]} />
                ) : (
                  <ProductIcon icon={p.icon} color={p.categoryColor} />
                )}
              </div>
              <span className="recently-viewed-name">{p.name[locale]}</span>
              <span className="recently-viewed-price">{formatPriceCents(p.priceCents, "EUR")}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
