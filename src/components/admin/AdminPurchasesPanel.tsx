"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { formatPriceCents } from "@/lib/currency";

type Purchase = {
  id: string;
  purchaseDate: string | Date;
  supplierName: string;
  productName: string;
  quantity: number;
  totalCostCents: number;
  shippingCostCents: number | null;
  customsCostCents: number | null;
  notes: string | null;
  attachmentUrl: string | null;
};

type ProductOption = { id: string; label: string };

export function AdminPurchasesPanel({
  purchases: initialPurchases,
  products,
}: {
  purchases: Purchase[];
  products: ProductOption[];
}) {
  const { t } = useLocale();
  const [purchases, setPurchases] = useState(initialPurchases);
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [supplierName, setSupplierName] = useState("");
  const [productName, setProductName] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [costInput, setCostInput] = useState("");
  const [shippingCostInput, setShippingCostInput] = useState("");
  const [customsCostInput, setCustomsCostInput] = useState("");
  const [notes, setNotes] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/purchases/upload", { method: "POST", body: formData });
    setUploading(false);
    if (!res.ok) {
      setError(t.admin.uploadFailed);
      return;
    }
    const data = await res.json();
    setAttachmentUrl(data.url);
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleFile(file);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const totalCostCents = Math.round(Number(costInput) * 100) || 0;
    const shippingCostCents = shippingCostInput ? Math.round(Number(shippingCostInput) * 100) || 0 : null;
    const customsCostCents = customsCostInput ? Math.round(Number(customsCostInput) * 100) || 0 : null;
    const res = await fetch("/api/admin/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purchaseDate,
        supplierName,
        productName,
        quantity,
        totalCostCents,
        shippingCostCents: shippingCostCents ?? undefined,
        customsCostCents: customsCostCents ?? undefined,
        notes: notes || undefined,
        attachmentUrl: attachmentUrl || undefined,
        productId: productId || undefined,
      }),
    });

    setSubmitting(false);
    if (!res.ok) {
      setError(t.admin.purchaseCreateFailed);
      return;
    }

    const data = await res.json();
    setPurchases((prev) => [
      {
        id: data.id,
        purchaseDate,
        supplierName,
        productName,
        quantity,
        totalCostCents,
        shippingCostCents,
        customsCostCents,
        notes: notes || null,
        attachmentUrl,
      },
      ...prev,
    ]);
    setSupplierName("");
    setProductName("");
    setProductId("");
    setQuantity(1);
    setCostInput("");
    setShippingCostInput("");
    setCustomsCostInput("");
    setNotes("");
    setAttachmentUrl(null);
  }

  async function onDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/admin/purchases/${id}`, { method: "DELETE" });
    setDeletingId(null);
    setPurchases((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <>
      <h1 className="auth-title">{t.admin.purchases}</h1>
      <p className="auth-sub">{t.admin.purchasesSubtitle}</p>

      <form className="auth-form admin-form-section" onSubmit={onSubmit}>
        <div className="field-row">
          <div className="field">
            <label>{t.admin.purchaseDate}</label>
            <input required type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </div>
          <div className="field">
            <label>{t.admin.purchaseSupplier}</label>
            <input required value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>{t.admin.purchaseProduct}</label>
            <input required value={productName} onChange={(e) => setProductName(e.target.value)} />
          </div>
          <div className="field">
            <label>{t.admin.quantity}</label>
            <input
              required
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div className="field">
            <label>{t.admin.purchaseCost}</label>
            <input required type="number" min={0} step={0.01} value={costInput} onChange={(e) => setCostInput(e.target.value)} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>{t.admin.purchaseShippingCost}</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={shippingCostInput}
              onChange={(e) => setShippingCostInput(e.target.value)}
            />
          </div>
          <div className="field">
            <label>{t.admin.purchaseCustomsCost}</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={customsCostInput}
              onChange={(e) => setCustomsCostInput(e.target.value)}
            />
          </div>
        </div>
        <p className="form-note">{t.admin.purchaseLandedCostHint}</p>
        <div className="field">
          <label>{t.admin.purchaseLinkedProduct}</label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">{t.admin.purchaseNoProductLink}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t.admin.purchaseNotes}</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="field">
          <label>{t.admin.purchaseAttachment}</label>
          {attachmentUrl ? (
            <div className="admin-image-actions">
              <a href={attachmentUrl} target="_blank" rel="noreferrer" className="btn btn-ghost-outline">
                {t.admin.purchaseViewAttachment}
              </a>
              <button type="button" className="btn btn-ghost-outline" onClick={() => setAttachmentUrl(null)}>
                {t.admin.removeImage}
              </button>
            </div>
          ) : (
            <label className="btn btn-ghost-outline admin-upload-btn">
              {uploading ? t.admin.uploading : t.admin.purchaseUploadAttachment}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                hidden
                disabled={uploading}
                onChange={onFileInput}
              />
            </label>
          )}
        </div>

        {error && <p className="field-error">{error}</p>}
        <button className="btn btn-brass" type="submit" disabled={submitting || uploading}>
          {submitting ? t.admin.saving : t.admin.purchaseAdd}
        </button>
      </form>

      {purchases.length === 0 ? (
        <p className="admin-empty-note">{t.admin.noPurchases}</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t.admin.purchaseDate}</th>
              <th>{t.admin.purchaseSupplier}</th>
              <th>{t.admin.purchaseProduct}</th>
              <th className="num-col">{t.admin.quantity}</th>
              <th className="num-col">{t.admin.purchaseCost}</th>
              <th className="num-col">{t.admin.purchaseShippingCost}</th>
              <th className="num-col">{t.admin.purchaseCustomsCost}</th>
              <th className="num-col">{t.admin.purchaseLandedCost}</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.purchaseDate).toLocaleDateString()}</td>
                <td>{p.supplierName}</td>
                <td>{p.productName}</td>
                <td className="num-col">{p.quantity}</td>
                <td className="num-col">{formatPriceCents(p.totalCostCents, "EUR")}</td>
                <td className="num-col">{p.shippingCostCents != null ? formatPriceCents(p.shippingCostCents, "EUR") : "—"}</td>
                <td className="num-col">{p.customsCostCents != null ? formatPriceCents(p.customsCostCents, "EUR") : "—"}</td>
                <td className="num-col">
                  {formatPriceCents(p.totalCostCents + (p.shippingCostCents ?? 0) + (p.customsCostCents ?? 0), "EUR")}
                </td>
                <td>
                  {p.attachmentUrl && (
                    <a href={p.attachmentUrl} target="_blank" rel="noreferrer" className="btn btn-ghost-outline">
                      {t.admin.purchaseViewAttachment}
                    </a>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost-outline"
                    disabled={deletingId === p.id}
                    onClick={() => onDelete(p.id)}
                  >
                    {t.admin.delete}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
