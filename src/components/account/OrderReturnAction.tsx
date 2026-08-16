"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

type ReturnStatus = "REQUESTED" | "APPROVED" | "REJECTED" | null;

// Eligibility (PAID + within the 14-day window) is computed server-side in the orders page,
// which can safely import src/lib/returns.ts - that module pulls in Prisma/PDF generation and
// must never end up in a client bundle.
export function OrderReturnAction({
  orderId,
  eligible,
  returnStatus: initialReturnStatus,
}: {
  orderId: string;
  eligible: boolean;
  returnStatus: ReturnStatus;
}) {
  const { t } = useLocale();
  const [returnStatus, setReturnStatus] = useState<ReturnStatus>(initialReturnStatus);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (returnStatus) {
    const label =
      returnStatus === "REQUESTED"
        ? t.account.returnStatusRequested
        : returnStatus === "APPROVED"
          ? t.account.returnStatusApproved
          : t.account.returnStatusRejected;
    return <span className="admin-empty-note-inline">{label}</span>;
  }

  if (!eligible) return null;

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost-outline" onClick={() => setOpen(true)}>
        {t.account.requestReturn}
      </button>
    );
  }

  async function submit() {
    if (!reason.trim()) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/account/orders/${orderId}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json().catch(() => null);
    setSubmitting(false);
    if (!res.ok) {
      setError(t.errors[data?.error as keyof typeof t.errors] ?? t.errors.UNKNOWN);
      return;
    }
    setReturnStatus("REQUESTED");
  }

  return (
    <div className="return-request-form">
      <label>{t.account.returnReasonLabel}</label>
      <textarea
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t.account.returnReasonPlaceholder}
      />
      {error && <p className="field-error">{error}</p>}
      <div className="return-request-form-actions">
        <button type="button" className="btn btn-brass" onClick={submit} disabled={submitting || !reason.trim()}>
          {submitting ? "…" : t.account.submitReturnRequest}
        </button>
        <button type="button" className="btn btn-ghost-outline" onClick={() => setOpen(false)} disabled={submitting}>
          {t.account.cancelReturnRequest}
        </button>
      </div>
    </div>
  );
}
