"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { formatPriceCents } from "@/lib/currency";

type LineItemInput = { description: string; quantity: number; unitPriceInput: string };

const emptyLineItem = (): LineItemInput => ({ description: "", quantity: 1, unitPriceInput: "" });

export function ManualInvoiceForm() {
  const { t } = useLocale();
  const router = useRouter();

  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lineItems, setLineItems] = useState<LineItemInput[]>([emptyLineItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateLine(index: number, patch: Partial<LineItemInput>) {
    setLineItems((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addLine() {
    setLineItems((rows) => [...rows, emptyLineItem()]);
  }

  function removeLine(index: number) {
    setLineItems((rows) => rows.filter((_, i) => i !== index));
  }

  const totalCents = lineItems.reduce((sum, row) => {
    const price = Math.round(Number(row.unitPriceInput) * 100) || 0;
    return sum + price * (row.quantity || 0);
  }, 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      buyerName,
      buyerAddress,
      deliveryDate,
      lineItems: lineItems.map((row) => ({
        description: row.description,
        quantity: row.quantity,
        unitPriceCents: Math.round(Number(row.unitPriceInput) * 100) || 0,
      })),
    };

    const res = await fetch("/api/admin/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (!res.ok) {
      setError(t.admin.invoiceCreateFailed);
      return;
    }

    router.push("/admin/invoices");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div className="admin-form-section">
        <h2 className="admin-form-section-title">{t.admin.invoiceBuyerCol}</h2>
        <div className="field">
          <label>{t.admin.invoiceBuyerName}</label>
          <input required value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
        </div>
        <div className="field">
          <label>{t.admin.invoiceBuyerAddress}</label>
          <textarea required value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} />
        </div>
        <div className="field">
          <label>{t.admin.deliveryDate}</label>
          <input required type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
        </div>
      </div>

      <div className="admin-form-section">
        <h2 className="admin-form-section-title">{t.admin.invoiceLineItems}</h2>
        {lineItems.map((row, i) => (
          <div className="invoice-line-row" key={i}>
            <input
              required
              placeholder={t.admin.description}
              value={row.description}
              onChange={(e) => updateLine(i, { description: e.target.value })}
            />
            <input
              required
              type="number"
              min={1}
              step={1}
              placeholder={t.admin.quantity}
              value={row.quantity}
              onChange={(e) => updateLine(i, { quantity: Math.max(1, Number(e.target.value) || 1) })}
            />
            <input
              required
              type="number"
              min={0}
              step={0.01}
              placeholder={t.admin.price}
              value={row.unitPriceInput}
              onChange={(e) => updateLine(i, { unitPriceInput: e.target.value })}
            />
            <button
              type="button"
              className="admin-attr-remove"
              onClick={() => removeLine(i)}
              disabled={lineItems.length === 1}
              aria-label={t.admin.removeAttribute}
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost-outline admin-add-attr-btn" onClick={addLine}>
          + {t.admin.invoiceAddLine}
        </button>

        <div className="invoice-total-preview">
          {t.admin.total}: {formatPriceCents(totalCents, "EUR")}
        </div>
      </div>

      {error && <p className="field-error">{error}</p>}

      <button className="btn btn-brass" type="submit" disabled={submitting}>
        {submitting ? t.admin.saving : t.admin.invoiceCreate}
      </button>
    </form>
  );
}
