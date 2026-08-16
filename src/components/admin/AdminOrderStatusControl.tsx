"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";

const STATUS_KEY = {
  PREPARING: "PREPARING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;

export function AdminOrderStatusControl({
  orderId,
  allowedNext,
}: {
  orderId: string;
  allowedNext: string[];
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [selected, setSelected] = useState(allowedNext[0] ?? "");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (allowedNext.length === 0) {
    return <p className="admin-empty-note">{t.admin.ordersNoActionsAvailable}</p>;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: selected,
        trackingNumber: selected === STATUS_KEY.SHIPPED ? trackingNumber || undefined : undefined,
        cancelReason: selected === STATUS_KEY.CANCELLED ? cancelReason || undefined : undefined,
      }),
    });

    setSubmitting(false);
    if (!res.ok) {
      setError(t.admin.ordersStatusChangeFailed);
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <form className="admin-order-status-form" onSubmit={onSubmit}>
      <div className="field">
        <label>{t.admin.ordersChangeStatusTo}</label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {allowedNext.map((s) => (
            <option key={s} value={s}>
              {t.account.orderStatus[s as keyof typeof t.account.orderStatus] ?? s}
            </option>
          ))}
        </select>
      </div>

      {selected === STATUS_KEY.SHIPPED && (
        <div className="field">
          <label>{t.admin.ordersTrackingNumber}</label>
          <input
            dir="ltr"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder={t.admin.ordersTrackingNumberPlaceholder}
          />
        </div>
      )}

      {selected === STATUS_KEY.CANCELLED && (
        <div className="field">
          <label>{t.admin.ordersCancelReason}</label>
          <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          <p className="form-note">{t.admin.ordersCancelReversalNote}</p>
        </div>
      )}

      {error && <p className="field-error">{error}</p>}
      {success && <p className="form-note">{t.admin.ordersStatusChanged}</p>}

      <button className="btn btn-brass" type="submit" disabled={submitting}>
        {submitting ? t.admin.saving : t.admin.ordersUpdateStatus}
      </button>
    </form>
  );
}
