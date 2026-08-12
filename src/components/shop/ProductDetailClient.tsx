"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useCart } from "@/components/cart/CartProvider";
import { useFlyToCart } from "@/components/FlyToCartProvider";
import { formatPriceCents } from "@/lib/currency";
import { ProductIcon } from "@/components/shop/ProductIcon";
import { WishButton } from "@/components/wishlist/WishButton";
import { recordProductView } from "@/lib/recentlyViewed";
import type { ProductDetail } from "@/types/product";
import type { Locale } from "@/i18n/config";

export function ProductDetailClient({ product }: { product: ProductDetail }) {
  const { locale, t } = useLocale();
  const { items, add, setQuantity } = useCart();
  const { fly } = useFlyToCart();
  const [infoOpen, setInfoOpen] = useState(true);
  const [descOpen, setDescOpen] = useState(false);

  useEffect(() => {
    recordProductView({
      id: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: product.priceCents,
      imageUrl: product.imageUrl,
      icon: product.icon,
      categoryColor: product.category.color,
    });
  }, [product]);

  const cartLine = items.find((i) => i.productId === product.id);
  const qty = cartLine?.quantity ?? 0;
  const attrs = product.attributes?.[locale as Locale] ?? [];
  const desc = product.description?.[locale as Locale];

  return (
    <section className="product-page">
      <div className="pp-inner">
        <nav className="pp-breadcrumb">
          <Link href="/">{t.nav.home}</Link> / {product.category.label[locale]}
        </nav>
        <div className="pp-grid">
          <div className="pp-gallery">
            <div className="pp-media">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name[locale]} />
              ) : (
                <ProductIcon icon={product.icon} color={product.category.color} />
              )}
            </div>
          </div>
          <div className="pp-info">
            <span className="product-brand">{product.brand}</span>
            <h1 className="pp-title">{product.name[locale]}</h1>
            <div className="pp-price">{formatPriceCents(product.priceCents, "EUR")}</div>

            <div className="pp-bottom-cluster">
              {attrs.length > 0 && (
                <div className="pp-attr-box">
                  {attrs.map((a, i) => (
                    <div className="pp-attr-col" key={i}>
                      <div className="pp-attr-label">{a.label}</div>
                      <div className="pp-attr-val">{a.value}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="qv-actions">
                <WishButton productId={product.id} className="pp-wish-btn" />
                <button
                  className="btn btn-brass qv-addbtn"
                  onClick={(e) => {
                    fly(e.currentTarget, product.imageUrl, product.icon);
                    add(product.id);
                  }}
                >
                  <span aria-hidden="true">🛒</span> {t.shop.addToCart}
                </button>
                {qty > 0 && (
                  <div className="qty-stepper qv-qty">
                    <button onClick={() => setQuantity(product.id, qty - 1)}>−</button>
                    <span>{qty}</span>
                    <button onClick={() => setQuantity(product.id, qty + 1)}>+</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pp-accordion">
          <button className="pp-accordion-head" onClick={() => setInfoOpen((v) => !v)}>
            <span>{t.pp.productInfo}</span>
            <span className="pp-accordion-icon">{infoOpen ? "−" : "+"}</span>
          </button>
          {infoOpen && (
            <div className="pp-accordion-body">
              <table className="pp-spec-table">
                <tbody>
                  <tr>
                    <td>{t.pp.brand}</td>
                    <td>{product.brand}</td>
                  </tr>
                  <tr>
                    <td>{t.pp.category}</td>
                    <td>{product.category.label[locale]}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {desc && (
          <div className="pp-accordion">
            <button className="pp-accordion-head" onClick={() => setDescOpen((v) => !v)}>
              <span>{t.pp.aboutProduct}</span>
              <span className="pp-accordion-icon">{descOpen ? "−" : "+"}</span>
            </button>
            {descOpen && (
              <div className="pp-accordion-body">
                <div className="pp-desc-body">{desc}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
