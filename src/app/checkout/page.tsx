"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { useLocale } from "@/components/LocaleProvider";
import { useCart } from "@/components/cart/CartProvider";
import { formatPriceCents } from "@/lib/currency";
import { maxRedeemablePoints, pointsEarnedForPaidCents, MIN_REDEEM_POINTS } from "@/lib/loyalty";
import { CountrySelect, PhoneField } from "@/components/CountryPhoneField";
import { combinePhone, type CountryCode } from "@/data/countries";

type CheckoutForm = {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postal: string;
  country: CountryCode | "";
  phone: string;
};

export default function CheckoutPage() {
  const { locale, t } = useLocale();
  const { items } = useCart();
  const { status: sessionStatus } = useSession();
  const [form, setForm] = useState<CheckoutForm>({
    fullName: "",
    email: "",
    address: "",
    city: "",
    postal: "",
    country: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  const subtotalCents = items.reduce((sum, i) => sum + i.product.priceCents * i.quantity, 0);
  const maxRedeemable = maxRedeemablePoints(subtotalCents, pointsBalance);
  const discountCents = Math.min(pointsToRedeem, maxRedeemable);
  const totalCents = subtotalCents - discountCents;

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    let cancelled = false;
    fetch("/api/loyalty")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setPointsBalance(data.balance ?? 0);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionStatus]);

  // Prefill the shipping form from the user's saved default address, if they have one.
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    let cancelled = false;
    fetch("/api/account/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setForm((f) => ({
          fullName: f.fullName || data.fullName || "",
          email: f.email || data.email || "",
          address: f.address || data.address || "",
          city: f.city || data.city || "",
          postal: f.postal || data.postal || "",
          country: f.country || data.country || "",
          phone: f.phone || data.phone || "",
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [sessionStatus]);

  function set<K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pointsToRedeem > 0 && pointsToRedeem < MIN_REDEEM_POINTS) {
      setError(t.errors.POINTS_BELOW_MINIMUM);
      return;
    }
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        phone: combinePhone(form.country, form.phone),
        lang: locale,
        pointsToRedeem: discountCents,
      }),
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
      <SiteChrome>
        <section className="cart-page">
          <div className="cart-page-inner">
            <p style={{ padding: "40px 0", textAlign: "center", opacity: 0.6 }}>{t.cart.emptyCart}</p>
            <Link href="/" className="btn btn-brass btn-block">
              {t.checkout.continueShopping}
            </Link>
          </div>
        </section>
      </SiteChrome>
    );
  }

  return (
    <SiteChrome>
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
            {discountCents > 0 && (
              <div className="line" style={{ color: "#2e7d32" }}>
                <span>{t.loyalty.discountLine}</span>
                <span>-{formatPriceCents(discountCents, "EUR")}</span>
              </div>
            )}
            <div className="line" style={{ fontWeight: 700, borderTop: "1px solid var(--line-dark)", marginTop: 6, paddingTop: 10 }}>
              <span>{t.checkout.total}</span>
              <span>{formatPriceCents(totalCents, "EUR")}</span>
            </div>
          </div>

          {sessionStatus === "authenticated" && maxRedeemable > 0 && (
            <div className="points-redeem-box">
              <div>{t.loyalty.redeemAtCheckout.replace("{balance}", String(pointsBalance)).replace("{max}", String(maxRedeemable))}</div>
              <div className="points-redeem-row">
                <input
                  type="number"
                  min={0}
                  max={maxRedeemable}
                  step={1}
                  value={pointsToRedeem}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setPointsToRedeem(Number.isFinite(v) ? Math.max(0, Math.min(v, maxRedeemable)) : 0);
                  }}
                  placeholder={String(MIN_REDEEM_POINTS)}
                />
                <button type="button" className="btn btn-ghost-outline" onClick={() => setPointsToRedeem(maxRedeemable)}>
                  {t.loyalty.useMax}
                </button>
                {pointsToRedeem > 0 && (
                  <button type="button" className="btn btn-ghost-outline" onClick={() => setPointsToRedeem(0)}>
                    {t.loyalty.clear}
                  </button>
                )}
              </div>
              {pointsToRedeem > 0 && pointsToRedeem < MIN_REDEEM_POINTS && (
                <p className="field-error">{t.errors.POINTS_BELOW_MINIMUM}</p>
              )}
            </div>
          )}

          {totalCents > 0 && (
            <p style={{ fontSize: "0.82rem", opacity: 0.65, marginTop: -8, marginBottom: 16 }}>
              {t.loyalty.earnEstimate.replace("{points}", String(pointsEarnedForPaidCents(totalCents)))}
            </p>
          )}

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
                <CountrySelect required value={form.country} onChange={(v) => set("country", v)} />
              </div>
              <div className="field">
                <label>{t.checkout.phone}</label>
                <PhoneField
                  required
                  country={form.country}
                  localNumber={form.phone}
                  onLocalNumberChange={(v) => set("phone", v)}
                />
              </div>
            </div>
            {error && <p className="field-error">{error}</p>}
            <button className="btn btn-brass btn-block" type="submit" disabled={submitting}>
              {submitting ? "…" : t.checkout.placeOrder}
            </button>
          </form>
        </div>
      </section>
    </SiteChrome>
  );
}
