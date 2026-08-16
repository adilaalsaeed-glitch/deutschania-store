"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { formatPriceCents } from "@/lib/currency";

type Expense = { id: string; description: string; amountCents: number };

export function MonthlyExpensesPanel({
  year,
  month,
  expenses: initialExpenses,
}: {
  year: number;
  month: number;
  expenses: Expense[];
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [expenses, setExpenses] = useState(initialExpenses);
  const [description, setDescription] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalCents = expenses.reduce((sum, e) => sum + e.amountCents, 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const amountCents = Math.round(Number(amountInput) * 100) || 0;
    const res = await fetch("/api/admin/monthly-expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month, description, amountCents }),
    });

    setSubmitting(false);
    if (!res.ok) {
      setError(t.admin.expenseCreateFailed);
      return;
    }

    const data = await res.json();
    setExpenses((prev) => [...prev, { id: data.id, description, amountCents }]);
    setDescription("");
    setAmountInput("");
    router.refresh();
  }

  async function onDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/admin/monthly-expenses/${id}`, { method: "DELETE" });
    setDeletingId(null);
    setExpenses((prev) => prev.filter((ex) => ex.id !== id));
    router.refresh();
  }

  return (
    <div className="admin-form-section">
      <h2 className="admin-form-section-title">{t.admin.salesExpenses}</h2>
      <p className="form-note">{t.admin.salesExpensesHint}</p>

      {expenses.length === 0 ? (
        <p className="admin-empty-note-inline">{t.admin.salesNoExpenses}</p>
      ) : (
        <ul className="monthly-expense-list">
          {expenses.map((ex) => (
            <li key={ex.id} className="monthly-expense-row">
              <span className="monthly-expense-description">{ex.description}</span>
              <span className="monthly-expense-amount">{formatPriceCents(ex.amountCents, "EUR")}</span>
              <button
                type="button"
                className="admin-attr-remove"
                onClick={() => onDelete(ex.id)}
                disabled={deletingId === ex.id}
                aria-label={t.admin.delete}
              >
                ✕
              </button>
            </li>
          ))}
          <li className="monthly-expense-row monthly-expense-total-row">
            <span className="monthly-expense-description">{t.admin.salesExpensesTotal}</span>
            <span className="monthly-expense-amount">{formatPriceCents(totalCents, "EUR")}</span>
            <span />
          </li>
        </ul>
      )}

      <form className="field-row monthly-expense-form" onSubmit={onSubmit}>
        <div className="field">
          <label>{t.admin.salesExpenseDescription}</label>
          <input required value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="field">
          <label>{t.admin.salesExpenseAmount}</label>
          <input required type="number" min={0} step={0.01} value={amountInput} onChange={(e) => setAmountInput(e.target.value)} />
        </div>
        <button className="btn btn-ghost-outline" type="submit" disabled={submitting}>
          {submitting ? t.admin.saving : t.admin.salesExpenseAdd}
        </button>
      </form>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
