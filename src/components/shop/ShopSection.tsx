"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { ProductCard } from "@/components/shop/ProductCard";
import { formatPriceCents } from "@/lib/currency";
import type { ProductListItem } from "@/types/product";
import type { Locale } from "@/i18n/config";

type Category = { key: string; label: Record<Locale, string>; icon: string; color: string };
type Sort = "featured" | "priceAsc" | "priceDesc";

export function ShopSection({
  products,
  categories,
  searchQuery,
  categoryKey,
  onCategoryChange,
  wishOnly = false,
}: {
  products: ProductListItem[];
  categories: Category[];
  searchQuery: string;
  categoryKey: string;
  onCategoryChange: (key: string) => void;
  wishOnly?: boolean;
}) {
  const { locale, t } = useLocale();
  const { isWished } = useWishlist();
  const [maxPriceCents, setMaxPriceCents] = useState(30000);
  const [brands, setBrands] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("featured");
  const [filterOpen, setFilterOpen] = useState(false);

  const allBrands = useMemo(() => [...new Set(products.map((p) => p.brand))].sort(), [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (wishOnly && !isWished(p.id)) return false;
      if (categoryKey !== "all" && p.categoryKey !== categoryKey) return false;
      if (p.priceCents > maxPriceCents) return false;
      if (brands.length > 0 && !brands.includes(p.brand)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.name[locale].toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    if (sort === "priceAsc") list = [...list].sort((a, b) => a.priceCents - b.priceCents);
    if (sort === "priceDesc") list = [...list].sort((a, b) => b.priceCents - a.priceCents);
    return list;
  }, [products, categoryKey, maxPriceCents, brands, searchQuery, sort, locale, wishOnly, isWished]);

  function toggleBrand(b: string) {
    setBrands((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  }

  function resetFilters() {
    onCategoryChange("all");
    setMaxPriceCents(30000);
    setBrands([]);
  }

  return (
    <section className="section" id="shop">
      <div className="section-inner">
        <div className="section-head">
          <span className="eyebrow" style={{ color: "var(--steel)" }}>
            {t.shop.eyebrow}
          </span>
          <h2 className="display">{t.shop.title}</h2>
        </div>

        <div className="shop-layout">
          <div className={`backdrop${filterOpen ? " open" : ""}`} onClick={() => setFilterOpen(false)} />
          <aside className={`filter-panel${filterOpen ? " open" : ""}`}>
            <div className="fp-head">
              <h3>{t.filter.title}</h3>
              <button className="fp-close" onClick={() => setFilterOpen(false)}>
                ✕
              </button>
            </div>
            <div className="fp-group">
              <div className="fp-title">{t.filter.products}</div>
              <select className="fp-select" value={categoryKey} onChange={(e) => onCategoryChange(e.target.value)}>
                <option value="all">{t.shop.allCats}</option>
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label[locale]}
                  </option>
                ))}
              </select>
            </div>
            <div className="fp-group">
              <div className="fp-title">{t.filter.price}</div>
              <div className="range-row">
                <input
                  type="range"
                  min={0}
                  max={30000}
                  value={maxPriceCents}
                  onChange={(e) => setMaxPriceCents(Number(e.target.value))}
                />
              </div>
              <div className="range-vals">
                {t.filter.upTo} {formatPriceCents(maxPriceCents, "EUR")}
              </div>
            </div>
            <div className="fp-group">
              <div className="fp-title">{t.filter.brand}</div>
              <div className="brand-list">
                {allBrands.map((b) => (
                  <label className="brand-item" key={b}>
                    <input type="checkbox" checked={brands.includes(b)} onChange={() => toggleBrand(b)} />
                    {b}
                  </label>
                ))}
              </div>
            </div>
            <button className="fp-reset" onClick={resetFilters}>
              {t.filter.reset}
            </button>
          </aside>

          <div>
            <div className="shop-toolbar">
              <div className="result-count">
                {filtered.length} {t.shop.results}
              </div>
              <div className="toolbar-right">
                <button className="filter-toggle" aria-label="Filters" onClick={() => setFilterOpen(true)}>
                  ⚙
                </button>
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                  <option value="featured">{t.shop.sortFeatured}</option>
                  <option value="priceAsc">{t.shop.sortPriceAsc}</option>
                  <option value="priceDesc">{t.shop.sortPriceDesc}</option>
                </select>
              </div>
            </div>
            <div className="product-grid">
              {filtered.length === 0 ? (
                <div className="empty-note">{wishOnly ? t.wishlist.empty : t.shop.empty}</div>
              ) : (
                filtered.map((p) => <ProductCard key={p.id} product={p} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
