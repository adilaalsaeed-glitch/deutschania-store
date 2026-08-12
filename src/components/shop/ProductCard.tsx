"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { useCart } from "@/components/cart/CartProvider";
import { useFlyToCart } from "@/components/FlyToCartProvider";
import { formatPriceCents, type CurrencyCode } from "@/lib/currency";
import { ProductIcon } from "@/components/shop/ProductIcon";
import { WishButton } from "@/components/wishlist/WishButton";
import { CompareCheck } from "@/components/compare/CompareCheck";
import type { ProductListItem } from "@/types/product";

export function ProductCard({ product }: { product: ProductListItem }) {
  const { locale, t } = useLocale();
  const { items, add, setQuantity } = useCart();
  const { fly } = useFlyToCart();
  const currency: CurrencyCode = "EUR";

  const cartLine = items.find((i) => i.productId === product.id);
  const qty = cartLine?.quantity ?? 0;

  return (
    <div className="product-card">
      <Link href={`/product/${product.slug}`} className="product-media">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name[locale]} />
        ) : (
          <ProductIcon icon={product.icon} color={product.category.color} />
        )}
        <span className="origin-flag">🇩🇪</span>
        <WishButton productId={product.id} className="wish-btn" />
      </Link>
      <button
        className="quick-add"
        aria-label={t.shop.addToCart}
        onClick={(e) => {
          e.preventDefault();
          fly(e.currentTarget, product.imageUrl, product.icon);
          add(product.id);
        }}
      >
        +
      </button>
      <div className="product-body">
        <span className="product-brand">{product.brand}</span>
        <Link href={`/product/${product.slug}`}>
          <p className="product-name">{product.name[locale]}</p>
        </Link>
        <div className="product-price">{formatPriceCents(product.priceCents, currency)}</div>
        {qty > 0 && (
          <div className="qty-stepper">
            <button onClick={() => setQuantity(product.id, qty - 1)}>−</button>
            <span>{qty}</span>
            <button onClick={() => setQuantity(product.id, qty + 1)}>+</button>
          </div>
        )}
        <CompareCheck productId={product.id} />
      </div>
    </div>
  );
}
