"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { formatPriceCents } from "@/lib/currency";
import { ProductIcon } from "@/components/shop/ProductIcon";
import type { Locale } from "@/i18n/config";

type I18nText = Record<Locale, string>;

type Row = {
  id: string;
  slug: string;
  brand: string;
  name: I18nText;
  description: I18nText | null;
  priceCents: number;
  imageUrl: string | null;
  icon: string;
  categoryKey: string;
  stockQuantity: number;
  domesticTaxRatePercent: 19 | 7 | null;
  category: { label: I18nText };
  _count: { orderItems: number };
};

type CategoryOption = { key: string; label: I18nText };

type AvailabilityFilter = "all" | "available" | "out";
type TaxRateFilter = "all" | "19" | "7" | "undetermined";

export function AdminProductsList({ products, categories }: { products: Row[]; categories: CategoryOption[] }) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [rows, setRows] = useState(products);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingStockId, setSavingStockId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");
  const [taxRateFilter, setTaxRateFilter] = useState<TaxRateFilter>("all");

  const brandOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.brand))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (categoryFilter !== "all" && r.categoryKey !== categoryFilter) return false;
      if (brandFilter !== "all" && r.brand !== brandFilter) return false;
      if (availabilityFilter === "available" && r.stockQuantity <= 0) return false;
      if (availabilityFilter === "out" && r.stockQuantity > 0) return false;
      if (taxRateFilter === "19" && r.domesticTaxRatePercent !== 19) return false;
      if (taxRateFilter === "7" && r.domesticTaxRatePercent !== 7) return false;
      if (taxRateFilter === "undetermined" && r.domesticTaxRatePercent !== null) return false;
      if (q) {
        const haystack = [
          r.brand,
          r.name.ar,
          r.name.de,
          r.name.en,
          r.description?.ar,
          r.description?.de,
          r.description?.en,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, categoryFilter, brandFilter, availabilityFilter, taxRateFilter]);

  async function handleDelete(row: Row) {
    const message =
      row._count.orderItems > 0
        ? `${t.admin.deleteWarningOrdersPart1} ${row._count.orderItems} ${t.admin.deleteWarningOrdersPart2}`
        : t.admin.deleteConfirm;
    if (!window.confirm(message)) return;

    setDeletingId(row.id);
    const res = await fetch(`/api/admin/products/${row.id}`, { method: "DELETE" });
    setDeletingId(null);

    if (!res.ok) {
      window.alert(t.admin.deleteFailed);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    router.refresh();
  }

  async function saveStock(row: Row, nextValue: number) {
    if (nextValue === row.stockQuantity) return;
    setSavingStockId(row.id);
    const res = await fetch(`/api/admin/products/${row.id}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockQuantity: nextValue }),
    });
    setSavingStockId(null);

    if (!res.ok) {
      window.alert(t.admin.stockUpdateFailed);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, stockQuantity: nextValue } : r)));
    router.refresh();
  }

  return (
    <>
      <div className="admin-page-head">
        <h1 className="auth-title">{t.admin.products}</h1>
        <Link href="/admin/products/new" className="btn btn-brass">
          + {t.admin.addProduct}
        </Link>
      </div>

      <div className="admin-filter-bar">
        <input
          type="text"
          className="admin-filter-search"
          placeholder={t.admin.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">{t.admin.allCategories}</option>
          {categories.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label[locale]}
            </option>
          ))}
        </select>
        <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
          <option value="all">{t.admin.allBrands}</option>
          {brandOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value as AvailabilityFilter)}>
          <option value="all">{t.admin.allAvailability}</option>
          <option value="available">{t.admin.availableStatus}</option>
          <option value="out">{t.admin.outOfStockStatus}</option>
        </select>
        <select value={taxRateFilter} onChange={(e) => setTaxRateFilter(e.target.value as TaxRateFilter)}>
          <option value="all">{t.admin.allDomesticTaxRates}</option>
          <option value="19">19%</option>
          <option value="7">7%</option>
          <option value="undetermined">{t.admin.domesticTaxRateUndetermined}</option>
        </select>
      </div>

      {filteredRows.length === 0 ? (
        <p className="admin-empty-note">{t.admin.noResults}</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>{t.admin.productCol}</th>
              <th className="num-col">{t.admin.price}</th>
              <th>{t.admin.categoryCol}</th>
              <th>{t.admin.domesticTaxRate}</th>
              <th className="num-col">{t.admin.stockQuantity}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="admin-thumb">
                    {r.imageUrl ? <img src={r.imageUrl} alt="" /> : <ProductIcon icon={r.icon} />}
                  </div>
                </td>
                <td>
                  <div className="admin-product-name">{r.name[locale]}</div>
                  <div className="admin-product-brand">{r.brand}</div>
                </td>
                <td className="num-col">{formatPriceCents(r.priceCents, "EUR")}</td>
                <td>{r.category.label[locale]}</td>
                <td>{r.domesticTaxRatePercent === null ? t.admin.domesticTaxRateUndetermined : `${r.domesticTaxRatePercent}%`}</td>
                <td className="num-col">
                  <div className="admin-stock-cell">
                    <input
                      key={`${r.id}-${r.stockQuantity}`}
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={r.stockQuantity}
                      className="admin-stock-input"
                      disabled={savingStockId === r.id}
                      onBlur={(e) => {
                        const next = Math.max(0, Math.floor(Number(e.target.value) || 0));
                        saveStock(r, next);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                      }}
                    />
                    <span className={`admin-stock-badge${r.stockQuantity > 0 ? " in-stock" : " out-of-stock"}`}>
                      {r.stockQuantity > 0 ? t.admin.availableStatus : t.admin.outOfStockStatus}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="admin-row-actions">
                    <Link href={`/admin/products/${r.id}`} className="btn btn-ghost-outline">
                      {t.admin.editProduct}
                    </Link>
                    <button
                      type="button"
                      className="btn btn-danger-outline"
                      onClick={() => handleDelete(r)}
                      disabled={deletingId === r.id}
                    >
                      {deletingId === r.id ? t.admin.deleting : t.admin.delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
