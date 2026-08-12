"use client";

import { useLocale } from "@/components/LocaleProvider";

export function BrandsCarousel({ brands }: { brands: string[] }) {
  const { t } = useLocale();

  if (brands.length === 0) return null;

  return (
    <section className="section">
      <div className="section-inner">
        <div className="section-head">
          <span className="eyebrow">{t.brandsCarousel.eyebrow}</span>
          <h2 className="display">{t.brandsCarousel.title}</h2>
        </div>
        <div className="brands-carousel-row">
          {brands.map((brand) => (
            <span className="brand-pill" key={brand}>
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
