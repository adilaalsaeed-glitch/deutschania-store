"use client";

import { useLocale } from "@/components/LocaleProvider";

export function MarketNotice() {
  const { t } = useLocale();
  return (
    <div className="market-notice">
      <span>{t.marketNotice}</span>
    </div>
  );
}
