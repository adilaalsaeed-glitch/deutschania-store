"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLocale } from "@/components/LocaleProvider";
import { formatPriceCents } from "@/lib/currency";

type Coupon = {
  id: string;
  code: string;
  valueCents: number;
  status: "ACTIVE" | "REDEEMED" | "EXPIRED";
  expiresAt: string;
  createdAt: string;
};

type ReferralData =
  | { enabled: false }
  | { enabled: true; referralUrl: string; successfulCount: number; coupons: Coupon[] };

export default function ReferralsPage() {
  const { locale, t } = useLocale();
  const { status: sessionStatus } = useSession();
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    let cancelled = false;
    fetch("/api/referral")
      .then((res) => res.json())
      .then((d) => {
        if (cancelled) return;
        setData(d);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionStatus]);

  function copyLink() {
    if (!data?.enabled) return;
    navigator.clipboard.writeText(data.referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (sessionStatus === "loading") {
    return (
        <section className="cart-page" />
    );
  }

  if (sessionStatus !== "authenticated") {
    return (
        <section className="cart-page">
          <div className="cart-page-inner confirm-box">
            <h1 className="auth-title">{t.rewards.referralTitle}</h1>
            <p className="auth-sub">{t.wishlist.loginRequired}</p>
            <Link href="/login" className="btn btn-brass" style={{ display: "inline-flex" }}>
              {t.nav.login}
            </Link>
          </div>
        </section>
    );
  }

  if (!data) {
    return (
        <section className="cart-page" />
    );
  }

  if (!data.enabled) {
    return (
        <section className="cart-page">
          <div className="cart-page-inner confirm-box">
            <h1 className="auth-title">{t.rewards.referralTitle}</h1>
            <p className="auth-sub">{t.referral.notAvailable}</p>
            <Link href="/account/rewards" className="btn btn-ghost-outline" style={{ display: "inline-flex" }}>
              {t.rewards.title}
            </Link>
          </div>
        </section>
    );
  }

  const statusLabel: Record<Coupon["status"], string> = {
    ACTIVE: t.referral.couponActive,
    REDEEMED: t.referral.couponRedeemed,
    EXPIRED: t.referral.couponExpired,
  };

  return (
      <section className="cart-page">
        <div className="cart-page-inner">
          <h1 className="auth-title">{t.rewards.referralTitle}</h1>
          <p className="auth-sub">{t.referral.subtitle}</p>

          <div className="cart-page-summary">
            <div className="points-balance-label">{t.referral.yourLink}</div>
            <div className="referral-link-row">
              <input readOnly value={data.referralUrl} onFocus={(e) => e.target.select()} />
              <button type="button" className="btn btn-brass" onClick={copyLink}>
                {copied ? t.referral.copied : t.referral.copy}
              </button>
            </div>
            <div className="points-balance-hint">{t.referral.shareHint}</div>
          </div>

          <div className="cart-page-summary" style={{ marginTop: 16 }}>
            <div className="points-balance-label">{t.referral.successfulCount}</div>
            <div className="points-balance-value">{data.successfulCount}</div>
          </div>

          <h2 className="auth-title" style={{ fontSize: "1.1rem", marginTop: 28 }}>
            {t.referral.couponsTitle}
          </h2>
          <div className="cart-page-body">
            {data.coupons.length === 0 ? (
              <p style={{ padding: "30px 0", textAlign: "center", opacity: 0.6 }}>{t.referral.noCoupons}</p>
            ) : (
              data.coupons.map((c) => (
                <div className="cart-page-item points-history-row" key={c.id}>
                  <div className="info">
                    <span className="name">{formatPriceCents(c.valueCents, "EUR")}</span>
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
