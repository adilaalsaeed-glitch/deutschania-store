"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { getRecentlyViewed, type RecentlyViewedProduct } from "@/lib/recentlyViewed";
import { formatPriceCents } from "@/lib/currency";
import { ProductIcon } from "@/components/shop/ProductIcon";

export function RecentlyViewedSection() {
  const { locale, t } = useLocale();
  // This component is only ever mounted client-side (see the dynamic import with
  // ssr:false in AccountDashboard.tsx), so reading localStorage here can't cause
  // a server/client hydration mismatch.
  const [items] = useState<RecentlyViewedProduct[]>(() => getRecentlyViewed());

  return (
    <div className="account-card" id="recently-viewed">
      <h2 className="account-card-title">{t.account.recentlyViewedTitle}</h2>
      {items.length === 0 ? (
        <p className="auth-sub">{t.account.recentlyViewedEmpty}</p>
      ) : (
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
      )}
    </div>
  );
}
