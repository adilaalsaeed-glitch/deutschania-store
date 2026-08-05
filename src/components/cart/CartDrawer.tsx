"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { useCart } from "@/components/cart/CartProvider";
import { formatPriceCents } from "@/lib/currency";
import { ProductIcon } from "@/components/shop/ProductIcon";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locale, t } = useLocale();
  const { items, setQuantity, remove } = useCart();

  const subtotalCents = items.reduce((sum, i) => sum + i.product.priceCents * i.quantity, 0);

  return (
    <>
      <div className={`backdrop${open ? " open" : ""}`} onClick={onClose} />
      <aside className={`drawer${open ? " open" : ""}`}>
        <div className="drawer-head">
          <h3>{t.cart.title}</h3>
          <button className="sm-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="drawer-body">
          {items.length === 0 ? (
            <p style={{ opacity: 0.6, textAlign: "center", padding: "40px 0" }}>{t.cart.emptyCart}</p>
          ) : (
            items.map((item) => (
              <div className="cart-item" key={item.id}>
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
            ))
          )}
        </div>
        {items.length > 0 && (
          <div className="drawer-foot">
            <div className="subtotal-row">
              <span>{t.cart.subtotal}</span>
              <span>{formatPriceCents(subtotalCents, "EUR")}</span>
            </div>
            <div className="subtotal-note">{t.cart.shippingNote}</div>
            <Link href="/checkout" className="btn btn-brass btn-block" onClick={onClose}>
              {t.cart.checkout}
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
