"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { useCart } from "@/components/cart/CartProvider";
import { formatPriceCents } from "@/lib/currency";

export type CheckoutFormValues = {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postal: string;
  country: string;
  phone: string;
};

export function CheckoutForm({ initialValues }: { initialValues: CheckoutFormValues }) {
  const { locale, t } = useLocale();
  const { items } = useCart();
  const [form, setForm] = useState<CheckoutFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const subtotalCents = items.reduce((sum, i) => sum + i.product.priceCents * i.quantity, 0);

  function set<K extends keyof CheckoutFormValues>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, lang: locale }),
    });
    const data = await res.json();

    if (!res.ok) {
      if (data.detail) console.error("Checkout error detail:", data.detail);
      setError(t.errors[data.error as keyof typeof t.errors] ?? t.errors.UNKNOWN);
      setSubmitting(false);
      return;
    }

    window.location.href = data.redirectUrl;
  }

  if (items.length === 0) {
    return (
      <section className="cart-page">
        <div className="cart-page-inner">
          <p style={{ padding: "40px 0", textAlign: "center", opacity: 0.6 }}>{t.cart.emptyCart}</p>
          <Link href="/" className="btn btn-brass btn-block">
            {t.checkout.continueShopping}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <div className="cart-page-inner">
        <nav className="pp-breadcrumb">
          <Link href="/cart">{t.cart.title}</Link>
        </nav>
        <h1 className="auth-title">{t.checkout.title}</h1>

        <div className="order-summary">
          {items.map((i) => (
            <div className="line" key={i.id}>
              <span>
                {i.product.name[locale]} × {i.quantity}
              </span>
              <span>{formatPriceCents(i.product.priceCents * i.quantity, "EUR")}</span>
            </div>
          ))}
          <div className="line" style={{ fontWeight: 700, borderTop: "1px solid var(--line-dark)", marginTop: 6, paddingTop: 10 }}>
            <span>{t.checkout.total}</span>
            <span>{formatPriceCents(subtotalCents, "EUR")}</span>
          </div>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="field">
            <label>{t.checkout.fullName}</label>
            <input required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </div>
          <div className="field">
            <label>{t.checkout.email}</label>
            <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="field">
            <label>{t.checkout.address}</label>
            <input required value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>{t.checkout.city}</label>
              <input required value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="field">
              <label>{t.checkout.postal}</label>
              <input required value={form.postal} onChange={(e) => set("postal", e.target.value)} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>{t.checkout.country}</label>
              <input required value={form.country} onChange={(e) => set("country", e.target.value)} />
            </div>
            <div className="field">
              <label>{t.checkout.phone}</label>
              <input required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>
          {error && <p className="field-error">{error}</p>}
          <button className="btn btn-brass btn-block" type="submit" disabled={submitting}>
            {submitting ? "…" : t.checkout.placeOrder}
          </button>
        </form>
      </div>
    </section>
  );
}
