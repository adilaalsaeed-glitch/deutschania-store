"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";

export function AdminUserSuspendControl({ userId, suspended: initialSuspended }: { userId: string; suspended: boolean }) {
  const { t } = useLocale();
  const router = useRouter();
  const [suspended, setSuspended] = useState(initialSuspended);
  const [reason, setReason] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(next: boolean) {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended: next, reason: next ? reason || undefined : undefined }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(t.admin.usersStatusChangeFailed);
      return;
    }
    setSuspended(next);
    setShowConfirm(false);
    router.refresh();
  }

  if (suspended) {
    return (
      <div>
        <p className="admin-empty-note">{t.admin.usersSuspendedNotice}</p>
        {error && <p className="field-error">{error}</p>}
        <button type="button" className="btn btn-brass" disabled={submitting} onClick={() => submit(false)}>
          {submitting ? t.admin.saving : t.admin.usersActivate}
        </button>
      </div>
    );
  }

  if (!showConfirm) {
    return (
      <button
        type="button"
        className="btn btn-ghost-outline"
        style={{ color: "var(--bad)", borderColor: "var(--bad)" }}
        onClick={() => setShowConfirm(true)}
      >
        {t.admin.usersSuspend}
      </button>
    );
  }

  return (
    <div>
      <div className="field">
        <label>{t.admin.usersSuspendReason}</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      {error && <p className="field-error">{error}</p>}
      <div className="admin-row-actions" style={{ justifyContent: "flex-start" }}>
        <button type="button" className="btn btn-ghost-outline" disabled={submitting} onClick={() => setShowConfirm(false)}>
          {t.admin.cancel}
        </button>
        <button
          type="button"
          className="btn btn-brass"
          style={{ background: "var(--bad)", color: "#fff" }}
          disabled={submitting}
          onClick={() => submit(true)}
        >
          {submitting ? t.admin.saving : t.admin.usersConfirmSuspend}
        </button>
      </div>
    </div>
  );
}
