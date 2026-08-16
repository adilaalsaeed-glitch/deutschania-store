"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { formatPriceCents } from "@/lib/currency";

type LineItemInput = { productId: string; descriptionAr: string; descriptionDe: string; quantity: number; unitPriceInput: string };

const emptyLineItem = (): LineItemInput => ({ productId: "", descriptionAr: "", descriptionDe: "", quantity: 1, unitPriceInput: "" });

const TAX_RATE_OPTIONS = [19, 7, 0] as const;

type ProductOption = { id: string; nameAr: string; nameDe: string; label: string; domesticTaxRatePercent: 19 | 7 | null };

export function ManualInvoiceForm({ products = [] }: { products?: ProductOption[] }) {
  const { t } = useLocale();
  const router = useRouter();

  const [buyerName, setBuyerName] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [taxRatePercent, setTaxRatePercent] = useState<(typeof TAX_RATE_OPTIONS)[number]>(19);
  const [kleinunternehmerNote, setKleinunternehmerNote] = useState(false);
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

  function changeTaxRate(rate: (typeof TAX_RATE_OPTIONS)[number]) {
    setTaxRatePercent(rate);
    if (rate !== 0) setKleinunternehmerNote(false);
  }

  function selectLineProduct(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateLine(index, {
      productId,
      ...(product ? { descriptionAr: product.nameAr, descriptionDe: product.nameDe } : {}),
    });
    if (product?.domesticTaxRatePercent != null) {
      changeTaxRate(product.domesticTaxRatePercent);
    }
  }

  const grossCents = lineItems.reduce((sum, row) => {
    const price = Math.round(Number(row.unitPriceInput) * 100) || 0;
    return sum + price * (row.quantity || 0);
  }, 0);
  // Same net/tax split the server computes from a gross (tax-inclusive) amount - shown live so
  // the chosen rate's effect is visible before submitting.
  const netCents = Math.round(grossCents / (1 + taxRatePercent / 100));
  const taxCents = grossCents - netCents;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      buyerName,
      street,
      postalCode,
      city,
      country,
      deliveryDate,
      taxRatePercent,
      kleinunternehmerNote,
      lineItems: lineItems.map((row) => ({
        descriptionAr: row.descriptionAr,
        descriptionDe: row.descriptionDe,
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
          <label>{t.admin.invoiceStreet}</label>
          <input required value={street} onChange={(e) => setStreet(e.target.value)} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>{t.admin.invoicePostalCode}</label>
            <input required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          </div>
          <div className="field">
            <label>{t.checkout.city}</label>
            <input required value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="field">
            <label>{t.checkout.country}</label>
            <input required value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>{t.admin.deliveryDate}</label>
          <input required type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
        </div>
      </div>

      <div className="admin-form-section">
        <h2 className="admin-form-section-title">{t.admin.invoiceTaxRate}</h2>
        <div className="field">
          <label>{t.admin.invoiceTaxRateLabel}</label>
          <select value={taxRatePercent} onChange={(e) => changeTaxRate(Number(e.target.value) as (typeof TAX_RATE_OPTIONS)[number])}>
            {TAX_RATE_OPTIONS.map((rate) => (
              <option key={rate} value={rate}>
                {rate}%
              </option>
            ))}
          </select>
        </div>
        {taxRatePercent === 0 && (
          <label className="admin-checkbox-row">
            <input type="checkbox" checked={kleinunternehmerNote} onChange={(e) => setKleinunternehmerNote(e.target.checked)} />
            {t.admin.invoiceKleinunternehmerNote}
          </label>
        )}
      </div>

      <div className="admin-form-section">
        <h2 className="admin-form-section-title">{t.admin.invoiceLineItems}</h2>
        {lineItems.map((row, i) => (
          <div className="invoice-line-block" key={i}>
            {products.length > 0 && (
              <div className="field">
                <label>{t.admin.invoiceLineProduct}</label>
                <select value={row.productId} onChange={(e) => selectLineProduct(i, e.target.value)}>
                  <option value="">{t.admin.invoiceLineProductFreeText}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="invoice-line-descriptions">
              <input
                required
                dir="rtl"
                placeholder={t.admin.descriptionAr}
                value={row.descriptionAr}
                onChange={(e) => updateLine(i, { descriptionAr: e.target.value })}
              />
              <input
                required
                dir="ltr"
                placeholder={t.admin.descriptionDe}
                value={row.descriptionDe}
                onChange={(e) => updateLine(i, { descriptionDe: e.target.value })}
              />
            </div>
            <div className="invoice-line-row">
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
          </div>
        ))}
        <button type="button" className="btn btn-ghost-outline admin-add-attr-btn" onClick={addLine}>
          + {t.admin.invoiceAddLine}
        </button>

        <div className="invoice-total-preview">
          <div>
            {t.admin.subtotal}: {formatPriceCents(netCents, "EUR")}
          </div>
          <div>
            {t.admin.tax} ({taxRatePercent}%): {formatPriceCents(taxCents, "EUR")}
          </div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>
            {t.admin.total}: {formatPriceCents(grossCents, "EUR")}
          </div>
        </div>
      </div>

      {error && <p className="field-error">{error}</p>}

      <button className="btn btn-brass" type="submit" disabled={submitting}>
        {submitting ? t.admin.saving : t.admin.invoiceCreate}
      </button>
    </form>
  );
}
