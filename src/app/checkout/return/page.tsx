"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { useLocale } from "@/components/LocaleProvider";
import { formatPriceCents, type CurrencyCode } from "@/lib/currency";

type OrderStatus = {
  orderNumber: string;
  status: "PENDING" | "PAID" | "FAILED" | "SHIPPED" | "CANCELLED";
  totalCents: number;
  currency: string;
};

function CheckoutReturnContent() {
  const { t } = useLocale();
  const params = useSearchParams();
  const orderNumber = params.get("order");
  const [order, setOrder] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (!orderNumber) return;
    let cancelled = false;
    async function poll() {
      const res = await fetch(`/api/orders/${orderNumber}`);
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setOrder(data);
      if (data.status === "PENDING") {
        setTimeout(poll, 2000);
      }
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  return (
    <section className="cart-page">
      <div className="cart-page-inner confirm-box">
        {!order ? (
          <p>…</p>
        ) : (
          <>
            <h1 className="auth-title">
              {order.status === "PAID"
                ? t.checkout.confirmTitle
                : order.status === "FAILED"
                  ? t.checkout.paymentFailedTitle
                  : t.checkout.processing}
            </h1>
            <p className="auth-sub">
              {order.status === "PAID"
                ? t.checkout.confirmDesc
                : order.status === "FAILED"
                  ? t.errors.PAYMENT_FAILED
                  : ""}
            </p>
            <div className="order-num">{order.orderNumber}</div>
            <p>{formatPriceCents(order.totalCents, order.currency as CurrencyCode)}</p>
            <Link href="/" className="btn btn-brass" style={{ marginTop: 16, display: "inline-flex" }}>
              {t.checkout.continueShopping}
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

export default function CheckoutReturnPage() {
  return (
    <SiteChrome>
      <Suspense fallback={<section className="cart-page" />}>
        <CheckoutReturnContent />
      </Suspense>
    </SiteChrome>
  );
}
