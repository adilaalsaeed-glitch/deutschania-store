"use client";

import { useLocale } from "@/components/LocaleProvider";
import { useCompare } from "@/components/compare/CompareProvider";

export function CompareCheck({ productId }: { productId: string }) {
  const { t } = useLocale();
  const { isComparing, toggle } = useCompare();

  return (
    <label className="compare-check" onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={isComparing(productId)} onChange={() => toggle(productId)} />
      {t.shop.addToCompare}
    </label>
  );
}
