"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useLocale } from "@/components/LocaleProvider";
import { formatPriceCents } from "@/lib/currency";
import { ProductIcon } from "@/components/shop/ProductIcon";
import type { Locale } from "@/i18n/config";

// localStorage isn't available during SSR, so this card only ever renders client-side
// (mirrors the same pattern used for the recently-viewed section on the account dashboard).
const RecentlyViewedCard = dynamic(() => import("./RecentlyViewedCard").then((m) => m.RecentlyViewedCard), {
  ssr: false,
});

type FeaturedProduct = {
  slug: string;
  name: Record<Locale, string>;
  priceCents: number;
  imageUrl: string | null;
  icon: string;
  categoryColor: string;
};

export function RewardsBonusCards({ featuredProduct }: { featuredProduct: FeaturedProduct | null }) {
  const { locale, t } = useLocale();

  return (
    <>
      <RecentlyViewedCard />

      <div className="rewards-card">
        <span className="rewards-card-icon">⭐</span>
        <h2 className="rewards-card-title">{t.rewards.recommendedTitle}</h2>
        {featuredProduct ? (
          <>
            <div className="rewards-product-preview">
              <div className="rewards-product-media">
                {featuredProduct.imageUrl ? (
                  <img src={featuredProduct.imageUrl} alt={featuredProduct.name[locale]} />
                ) : (
                  <ProductIcon icon={featuredProduct.icon} color={featuredProduct.categoryColor} />
                )}
              </div>
              <div>
                <div className="rewards-product-name">{featuredProduct.name[locale]}</div>
                <div className="rewards-product-price">{formatPriceCents(featuredProduct.priceCents, "EUR")}</div>
              </div>
            </div>
            <Link
              href={`/product/${featuredProduct.slug}`}
              className="btn btn-brass"
              style={{ marginTop: 8, alignSelf: "flex-start" }}
            >
              {t.rewards.viewProduct}
            </Link>
          </>
        ) : (
          <p className="rewards-card-desc">{t.rewards.recommendedEmpty}</p>
        )}
      </div>
    </>
  );
}
