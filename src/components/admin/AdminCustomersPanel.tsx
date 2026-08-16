"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

type CustomerRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  role: string;
};

export function AdminCustomersPanel() {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<CustomerRow | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setSearching(true);
    setSelected(null);
    setDeleted(false);
    setMessage(null);
    const res = await fetch(`/api/admin/customers?q=${encodeURIComponent(query.trim())}`);
    const data = await res.json().catch(() => ({ users: [] }));
    setSearching(false);
    setResults(data.users ?? []);
  }

  function selectCustomer(row: CustomerRow) {
    setSelected(row);
    setConfirmText("");
    setDeleted(false);
    setMessage(null);
  }

  async function deleteCustomer() {
    if (!selected) return;
    setDeleting(true);
    setMessage(null);
    const res = await fetch(`/api/admin/customers/${selected.id}/delete`, { method: "POST" });
    setDeleting(false);
    if (!res.ok) {
      setMessage(t.admin.customerDeleteFailed);
      return;
    }
    setDeleted(true);
    setResults((prev) => prev.filter((r) => r.id !== selected.id));
    setMessage(t.admin.customerDeleted);
  }

  return (
    <>
      <h1 className="auth-title">{t.admin.customers}</h1>

      <form className="admin-customer-search" onSubmit={search}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.admin.customerSearchPlaceholder}
        />
        <button type="submit" className="btn btn-brass" disabled={searching || query.trim().length < 2}>
          {searching ? "…" : t.admin.customerSearchButton}
        </button>
      </form>

      {results.length > 0 && (
        <table className="admin-table" style={{ marginTop: 16 }}>
          <tbody>
            {results.map((r) => (
              <tr
                key={r.id}
                onClick={() => selectCustomer(r)}
                style={{ cursor: "pointer", background: selected?.id === r.id ? "var(--sand)" : undefined }}
              >
                <td>
                  {r.firstName} {r.lastName}
                  <br />
                  <span style={{ opacity: 0.6, fontSize: "0.8rem" }}>{r.email}</span>
                </td>
                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {query.trim().length >= 2 && !searching && results.length === 0 && (
        <p className="admin-empty-note">{t.admin.noCustomersFound}</p>
      )}

      {selected && (
        <div className="admin-customer-detail">
          <h2 style={{ fontSize: "1rem", margin: "0 0 6px" }}>
            {selected.firstName} {selected.lastName}
          </h2>
          <p style={{ opacity: 0.7, fontSize: "0.85rem", margin: "0 0 16px" }}>{selected.email}</p>

          <div className="admin-row-actions" style={{ justifyContent: "flex-start", marginBottom: 16 }}>
            <a href={`/api/admin/customers/${selected.id}/export`} className="btn btn-ghost-outline">
              {t.admin.customerExport}
            </a>
          </div>

          {!deleted && (
            <div className="admin-customer-delete-box">
              <p className="field-error" style={{ marginBottom: 8 }}>
                {t.admin.customerDeleteConfirm.replace("{email}", selected.email)}
              </p>
              <div className="admin-customer-search" style={{ maxWidth: 420 }}>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={t.admin.customerDeleteConfirmPlaceholder}
                  dir="ltr"
                />
                <button
                  type="button"
                  className="btn btn-ghost-outline"
                  style={{ color: "var(--bad)", borderColor: "var(--bad)" }}
                  disabled={deleting || confirmText.trim().toLowerCase() !== selected.email.toLowerCase()}
                  onClick={deleteCustomer}
                >
                  {deleting ? "…" : t.admin.customerDelete}
                </button>
              </div>
            </div>
          )}

          {message && <p className="form-note" style={{ marginTop: 10 }}>{message}</p>}
        </div>
      )}
    </>
  );
}
