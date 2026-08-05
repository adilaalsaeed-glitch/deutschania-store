"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import type { Locale } from "@/i18n/config";

type Row = {
  id: string;
  slug: string;
  brand: string;
  name: Record<Locale, string>;
  priceCents: number;
};

export function AdminProductsTable({ products }: { products: Row[] }) {
  const { locale, t } = useLocale();
  const [rows, setRows] = useState(products);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function save(id: string, priceCents: number, brand: string) {
    setSavingId(id);
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceCents, brand }),
    });
    setSavingId(null);
  }

  function update(id: string, field: "priceCents" | "brand", value: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, [field]: field === "priceCents" ? Math.round(Number(value) * 100) : value } : r
      )
    );
  }

  return (
    <>
      <h1 className="auth-title">{t.admin.products}</h1>
      <table className="admin-table">
        <thead>
          <tr>
            <th>{t.admin.productCol}</th>
            <th>{t.admin.brand}</th>
            <th>{t.admin.price}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.name[locale]}</td>
              <td>
                <input value={r.brand} onChange={(e) => update(r.id, "brand", e.target.value)} />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  value={(r.priceCents / 100).toFixed(2)}
                  onChange={(e) => update(r.id, "priceCents", e.target.value)}
                />
              </td>
              <td>
                <button
                  className="btn btn-brass"
                  disabled={savingId === r.id}
                  onClick={() => save(r.id, r.priceCents, r.brand)}
                >
                  {savingId === r.id ? t.admin.saving : t.admin.save}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
