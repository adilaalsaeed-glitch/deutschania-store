"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLocale } from "@/components/LocaleProvider";
import { formatPriceCents } from "@/lib/currency";

type Submission = {
  status: "PENDING" | "APPROVED" | "REJECTED";
  profileUrl: string;
  videoUrl: string;
  createdAt: string;
};

type Coupon = {
  id: string;
  code: string;
  percentage: number;
  minOrderCents: number;
  status: "ACTIVE" | "REDEEMED" | "EXPIRED";
  expiresAt: string;
};

type ContentCouponData =
  | { enabled: false }
  | { enabled: true; submission: Submission | null; coupons: Coupon[] };

export default function ContentCouponPage() {
  const { locale, t } = useLocale();
  const { status: sessionStatus } = useSession();
  const [data, setData] = useState<ContentCouponData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [profileUrl, setProfileUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    let cancelled = false;
    fetch("/api/content-coupon")
      .then((res) => res.json())
      .then((d) => {
        if (cancelled) return;
        setData(d);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionStatus, refreshKey]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/content-coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileUrl, videoUrl, consent }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(t.errors[body.error as keyof typeof t.errors] ?? t.errors.UNKNOWN);
      return;
    }
    setProfileUrl("");
    setVideoUrl("");
    setConsent(false);
    setRefreshKey((k) => k + 1);
  }

  if (sessionStatus === "loading" || (sessionStatus === "authenticated" && !data)) {
    return (
        <section className="cart-page" />
    );
  }

  if (sessionStatus !== "authenticated") {
    return (
        <section className="cart-page">
          <div className="cart-page-inner confirm-box">
            <h1 className="auth-title">{t.rewards.contentCouponTitle}</h1>
            <p className="auth-sub">{t.wishlist.loginRequired}</p>
            <Link href="/login" className="btn btn-brass" style={{ display: "inline-flex" }}>
              {t.nav.login}
            </Link>
          </div>
        </section>
    );
  }

  if (!data!.enabled) {
    return (
        <section className="cart-page">
          <div className="cart-page-inner confirm-box">
            <h1 className="auth-title">{t.rewards.contentCouponTitle}</h1>
            <p className="auth-sub">{t.contentCoupon.notAvailable}</p>
            <Link href="/account/rewards" className="btn btn-ghost-outline" style={{ display: "inline-flex" }}>
              {t.rewards.title}
            </Link>
          </div>
        </section>
    );
  }

  const { submission, coupons } = data!;
  const canApply = !submission || submission.status === "REJECTED";

  const statusLabel: Record<Coupon["status"], string> = {
    ACTIVE: t.referral.couponActive,
    REDEEMED: t.referral.couponRedeemed,
    EXPIRED: t.referral.couponExpired,
  };

  return (
      <section className="cart-page">
        <div className="cart-page-inner">
          <h1 className="auth-title">{t.rewards.contentCouponTitle}</h1>
          <p className="auth-sub">{t.contentCoupon.subtitle}</p>

          {submission && submission.status === "PENDING" && (
            <div className="cart-page-summary">
              <p style={{ margin: 0 }}>{t.contentCoupon.pendingNotice}</p>
            </div>
          )}

          {submission && submission.status === "REJECTED" && (
            <div className="cart-page-summary">
              <p style={{ margin: 0 }}>{t.contentCoupon.rejectedNotice}</p>
            </div>
          )}

          {canApply && (
            <form className="auth-form" onSubmit={onSubmit} style={{ marginTop: 16 }}>
              <div className="field">
                <label>{t.contentCoupon.profileUrlLabel}</label>
                <input
                  type="url"
                  required
                  placeholder="https://instagram.com/..."
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                />
              </div>
              <div className="field">
                <label>{t.contentCoupon.videoUrlLabel}</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>
              <label className="admin-toggle-row" style={{ marginBottom: 14 }}>
                <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>{t.contentCoupon.consentText}</span>
              </label>
              {error && <p className="field-error">{error}</p>}
              <button className="btn btn-brass btn-block" type="submit" disabled={submitting}>
                {submitting ? "…" : t.contentCoupon.submit}
              </button>
            </form>
          )}

          <h2 className="auth-title" style={{ fontSize: "1.1rem", marginTop: 28 }}>
            {t.contentCoupon.couponsTitle}
          </h2>
          <div className="cart-page-body">
            {coupons.length === 0 ? (
              <p style={{ padding: "30px 0", textAlign: "center", opacity: 0.6 }}>{t.contentCoupon.noCoupons}</p>
            ) : (
              coupons.map((c) => (
                <div className="cart-page-item points-history-row" key={c.id}>
                  <div className="info">
                    <span className="name">
                      {t.contentCoupon.discountValue
                        .replace("{percentage}", String(c.percentage))
                        .replace("{minOrder}", formatPriceCents(c.minOrderCents, "EUR"))}
                    </span>
                    <span className="price">
                      {statusLabel[c.status]} · {t.referral.expiresOn}{" "}
                      {new Date(c.expiresAt).toLocaleDateString(locale === "ar" ? "ar-EG" : locale)}
                    </span>
                  </div>
                  <span className="referral-coupon-code">{c.code}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
  );
}
