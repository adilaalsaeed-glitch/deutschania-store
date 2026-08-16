"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { formatPriceCents } from "@/lib/currency";

type Row = {
  id: string;
  orderNumber: string;
  email: string;
  totalCents: number;
  returnStatus: "REQUESTED" | "APPROVED" | "REJECTED";
  returnReason: string | null;
  returnRequestedAt: string;
};

export function AdminReturnsTable({ orders }: { orders: Row[] }) {
  const { t } = useLocale();
  const [rows, setRows] = useState(orders);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(id: string, decision: "APPROVE" | "REJECT") {
    setActingId(id);
    setError(null);
    const res = await fetch(`/api/admin/orders/${id}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setActingId(null);
    if (!res.ok) {
      setError(t.admin.returnActionFailed);
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, returnStatus: decision === "APPROVE" ? "APPROVED" : "REJECTED" } : r))
    );
  }

  const statusLabel: Record<Row["returnStatus"], string> = {
    REQUESTED: t.account.returnStatusRequested,
    APPROVED: t.account.returnStatusApproved,
    REJECTED: t.account.returnStatusRejected,
  };

  return (
    <>
      <h1 className="auth-title">{t.admin.returns}</h1>
      {error && <p className="field-error">{error}</p>}
      {rows.length === 0 ? (
        <p className="admin-empty-note">{t.admin.noReturns}</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t.admin.returnOrderCol}</th>
              <th>{t.admin.returnCustomerCol}</th>
              <th>{t.admin.returnReasonCol}</th>
              <th>{t.admin.returnRequestedCol}</th>
              <th>{t.admin.returnStatusCol}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td dir="ltr" style={{ textAlign: "start" }}>
                  {r.orderNumber}
                  <br />
                  <span style={{ opacity: 0.6, fontSize: "0.8rem" }}>{formatPriceCents(r.totalCents, "EUR")}</span>
                </td>
                <td>{r.email}</td>
                <td style={{ maxWidth: 260 }}>{r.returnReason}</td>
                <td>{new Date(r.returnRequestedAt).toLocaleDateString()}</td>
                <td>{statusLabel[r.returnStatus]}</td>
                <td>
                  {r.returnStatus === "REQUESTED" && (
                    <div className="admin-row-actions">
                      <button
                        className="btn btn-brass"
                        disabled={actingId === r.id}
                        onClick={() => decide(r.id, "APPROVE")}
                      >
                        {t.admin.returnApprove}
                      </button>
                      <button
                        className="btn btn-ghost-outline"
                        disabled={actingId === r.id}
                        onClick={() => decide(r.id, "REJECT")}
                      >
                        {t.admin.returnReject}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
