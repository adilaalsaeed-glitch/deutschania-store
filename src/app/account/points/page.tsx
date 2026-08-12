"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { useLocale } from "@/components/LocaleProvider";

type Transaction = {
  id: string;
  type: "EARN" | "REDEEM" | "REFUND";
  points: number;
  orderNumber: string | null;
  createdAt: string;
};

export default function PointsPage() {
  const { locale, t } = useLocale();
  const { status } = useSession();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    fetch("/api/loyalty")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setBalance(data.balance ?? 0);
        setTransactions(data.transactions ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === "loading") {
    return (
      <SiteChrome>
        <section className="cart-page" />
      </SiteChrome>
    );
  }

  if (status !== "authenticated") {
    return (
      <SiteChrome>
        <section className="cart-page">
          <div className="cart-page-inner confirm-box">
            <h1 className="auth-title">{t.loyalty.title}</h1>
            <p className="auth-sub">{t.wishlist.loginRequired}</p>
            <Link href="/login" className="btn btn-brass" style={{ display: "inline-flex" }}>
              {t.nav.login}
            </Link>
          </div>
        </section>
      </SiteChrome>
    );
  }

  const typeLabel: Record<Transaction["type"], string> = {
    EARN: t.loyalty.earned,
    REDEEM: t.loyalty.redeemed,
    REFUND: t.loyalty.refunded,
  };

  return (
    <SiteChrome>
      <section className="cart-page">
        <div className="cart-page-inner">
          <h1 className="auth-title">{t.loyalty.title}</h1>
          <p className="auth-sub">{t.loyalty.subtitle}</p>

          <div className="cart-page-summary">
            <div className="points-balance-label">{t.loyalty.balanceLabel}</div>
            <div className="points-balance-value">{balance ?? "…"}</div>
            <div className="points-balance-hint">{t.loyalty.balanceHint}</div>
          </div>

          <div className="cart-page-body" style={{ marginTop: 20 }}>
            {transactions.length === 0 ? (
              <p style={{ padding: "30px 0", textAlign: "center", opacity: 0.6 }}>{t.loyalty.empty}</p>
            ) : (
              transactions.map((tx) => (
                <div className="cart-page-item points-history-row" key={tx.id}>
                  <div className="info">
                    <span className="name">{typeLabel[tx.type]}</span>
                    <span className="price">
                      {tx.orderNumber ? `${t.loyalty.order} ${tx.orderNumber} · ` : ""}
                      {new Date(tx.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : locale)}
                    </span>
                  </div>
                  <span className={`points-delta ${tx.points >= 0 ? "positive" : "negative"}`}>
                    {tx.points >= 0 ? "+" : ""}
                    {tx.points}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
