"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { formatPriceCents } from "@/lib/currency";
import { ProductIcon } from "@/components/shop/ProductIcon";
import type { Locale } from "@/i18n/config";

type Row = {
  id: string;
  slug: string;
  brand: string;
  name: Record<Locale, string>;
  priceCents: number;
  imageUrl: string | null;
  icon: string;
  _count: { orderItems: number };
};

export function AdminProductsList({ products }: { products: Row[] }) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [rows, setRows] = useState(products);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  return (
    <>
      <div className="admin-page-head">
        <h1 className="auth-title">{t.admin.products}</h1>
        <Link href="/admin/products/new" className="btn btn-brass">
          + {t.admin.addProduct}
        </Link>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th></th>
            <th>{t.admin.productCol}</th>
            <th>{t.admin.brand}</th>
            <th>{t.admin.price}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <div className="admin-thumb">
                  {r.imageUrl ? <img src={r.imageUrl} alt="" /> : <ProductIcon icon={r.icon} />}
                </div>
              </td>
              <td>{r.name[locale]}</td>
              <td>{r.brand}</td>
              <td>{formatPriceCents(r.priceCents, "EUR")}</td>
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
    </>
  );
}
