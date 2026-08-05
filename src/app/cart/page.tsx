"use client";

import Link from "next/link";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { useLocale } from "@/components/LocaleProvider";
import { useCart } from "@/components/cart/CartProvider";
import { formatPriceCents } from "@/lib/currency";
import { ProductIcon } from "@/components/shop/ProductIcon";

export default function CartPage() {
  const { locale, t } = useLocale();
  const { items, setQuantity, remove } = useCart();
  const subtotalCents = items.reduce((sum, i) => sum + i.product.priceCents * i.quantity, 0);

  return (
    <SiteChrome>
      <section className="cart-page">
        <div className="cart-page-inner">
          <nav className="pp-breadcrumb">
            <Link href="/">{t.nav.home}</Link>
          </nav>
          <h1 className="auth-title">{t.cart.title}</h1>

          {items.length === 0 ? (
            <div className="cart-page-body" style={{ textAlign: "center", padding: "40px 0", opacity: 0.6 }}>
              {t.cart.emptyCart}
            </div>
          ) : (
            <>
              <div className="cart-page-body">
                {items.map((item) => (
                  <div className="cart-page-item" key={item.id}>
                    <div className="media">
                      {item.product.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product.name[locale]} />
                      ) : (
                        <ProductIcon icon={item.product.icon} />
                      )}
                    </div>
                    <div className="info">
                      <div className="name">{item.product.name[locale]}</div>
                      <div className="price">{formatPriceCents(item.product.priceCents, "EUR")}</div>
                      <div className="row-btm">
                        <div className="mini-stepper">
                          <button onClick={() => setQuantity(item.productId, item.quantity - 1)}>−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => setQuantity(item.productId, item.quantity + 1)}>+</button>
                        </div>
                        <button className="remove-link" onClick={() => remove(item.productId)}>
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-page-summary">
                <div className="subtotal-row">
                  <span>{t.cart.subtotal}</span>
                  <span>{formatPriceCents(subtotalCents, "EUR")}</span>
                </div>
                <div className="subtotal-note">{t.cart.shippingNote}</div>
                <Link href="/checkout" className="btn btn-brass btn-block" style={{ marginTop: 14 }}>
                  {t.cart.checkout}
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </SiteChrome>
  );
}
