"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { getRecentlyViewed } from "@/lib/recentlyViewed";

export function RecentlyViewedCard() {
  const { t } = useLocale();
  const [items] = useState(() => getRecentlyViewed());

  return (
    <div className="rewards-card">
      <span className="rewards-card-icon">🕐</span>
      <h2 className="rewards-card-title">{t.rewards.recentlyViewedTitle}</h2>
      <p className="rewards-card-desc">
        {items.length > 0
          ? t.rewards.recentlyViewedDesc.replace("{count}", String(items.length))
          : t.rewards.recentlyViewedEmpty}
      </p>
      {items.length > 0 && (
        <Link href="/account#recently-viewed" className="btn btn-brass" style={{ marginTop: 8, alignSelf: "flex-start" }}>
          {t.rewards.viewAll}
        </Link>
      )}
    </div>
  );
}
