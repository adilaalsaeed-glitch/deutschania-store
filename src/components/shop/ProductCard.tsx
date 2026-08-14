"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { useCart } from "@/components/cart/CartProvider";
import { useFlyToCart } from "@/components/FlyToCartProvider";
import { formatPriceCents, type CurrencyCode } from "@/lib/currency";
import { ProductIcon } from "@/components/shop/ProductIcon";
import { WishButton } from "@/components/wishlist/WishButton";
import { CompareCheck } from "@/components/compare/CompareCheck";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import type { ProductListItem } from "@/types/product";

export function ProductCard({ product }: { product: ProductListItem }) {
  const { locale, t } = useLocale();
  const { items, add, setQuantity } = useCart();
  const { fly } = useFlyToCart();
  const currency: CurrencyCode = "EUR";

  const cartLine = items.find((i) => i.productId === product.id);
  const qty = cartLine?.quantity ?? 0;
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= LOW_STOCK_THRESHOLD;

  async function handleResult(result: { ok: boolean; error?: string }) {
    if (!result.ok) {
      window.alert(t.errors[result.error as keyof typeof t.errors] ?? t.errors.UNKNOWN);
    }
  }

  return (
    <div className="product-card">
      <Link href={`/product/${product.slug}`} className="product-media">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name[locale]} />
        ) : (
          <ProductIcon icon={product.icon} color={product.category.color} />
        )}
        <span className="origin-flag">🇩🇪</span>
        {isOutOfStock ? (
          <span className="scarcity-badge out-of-stock">{t.admin.outOfStockStatus}</span>
        ) : (
          isLowStock && (
            <span className="scarcity-badge">{t.shop.scarcity.replace("{count}", String(product.stockQuantity))}</span>
          )
        )}
        <WishButton productId={product.id} className="wish-btn" />
      </Link>
      <button
        className="quick-add"
        aria-label={isOutOfStock ? t.errors.OUT_OF_STOCK : t.shop.addToCart}
        disabled={isOutOfStock}
        onClick={(e) => {
          e.preventDefault();
          fly(e.currentTarget, product.imageUrl, product.icon);
          add(product.id).then(handleResult);
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
            <button onClick={() => setQuantity(product.id, qty - 1).then(handleResult)}>−</button>
            <span>{qty}</span>
            <button disabled={qty >= product.stockQuantity} onClick={() => setQuantity(product.id, qty + 1).then(handleResult)}>
              +
            </button>
          </div>
        )}
        <CompareCheck productId={product.id} />
      </div>
    </div>
  );
}
