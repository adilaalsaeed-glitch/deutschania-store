"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useCart } from "@/components/cart/CartProvider";
import { useFlyToCart } from "@/components/FlyToCartProvider";
import { useCompare } from "@/components/compare/CompareProvider";
import { formatPriceCents } from "@/lib/currency";
import { ProductIcon } from "@/components/shop/ProductIcon";
import type { ProductListItem } from "@/types/product";

export function CompareModal() {
  const { locale, t } = useLocale();
  const { ids, open, closeModal, remove } = useCompare();
  const { add } = useCart();
  const { fly } = useFlyToCart();
  const [products, setProducts] = useState<ProductListItem[]>([]);

  useEffect(() => {
    if (!open || ids.length === 0) {
      Promise.resolve().then(() => setProducts([]));
      return;
    }
    fetch(`/api/products/compare?ids=${ids.join(",")}`)
      .then((res) => res.json())
      .then((data) => setProducts(data.products ?? []));
  }, [open, ids]);

  return (
    <div className={`modal-backdrop${open ? " open" : ""}`} onClick={closeModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={closeModal}>
          ✕
        </button>
        <h2>{t.compare.title}</h2>
        {ids.length === 0 ? (
          <div className="empty-note">{t.compare.empty}</div>
        ) : (
          <div className="compare-grid">
            {products.map((p) => (
              <div className="compare-card" key={p.id}>
                <button className="remove-link compare-remove" onClick={() => remove(p.id)}>
                  ✕
                </button>
                <div className="compare-media">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name[locale]} />
                  ) : (
                    <ProductIcon icon={p.icon} color={p.category.color} />
                  )}
                </div>
                <div className="product-brand">{p.brand}</div>
                <div className="product-name">{p.name[locale]}</div>
                <div className="product-price">{formatPriceCents(p.priceCents, "EUR")}</div>
                <div className="compare-cat">{p.category.label[locale]}</div>
                {p.stockQuantity <= 0 ? (
                  <span className="scarcity-badge out-of-stock qv-outofstock">{t.errors.OUT_OF_STOCK}</span>
                ) : (
                  <button
                    className="btn btn-brass compare-add"
                    onClick={(e) => {
                      fly(e.currentTarget, p.imageUrl, p.icon);
                      add(p.id).then((result) => {
                        if (!result.ok) {
                          window.alert(t.errors[result.error as keyof typeof t.errors] ?? t.errors.UNKNOWN);
                        }
                      });
                    }}
                  >
                    <span aria-hidden="true">🛒</span> {t.shop.addToCart}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
