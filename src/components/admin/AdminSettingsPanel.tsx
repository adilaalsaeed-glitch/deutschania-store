"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

export function AdminSettingsPanel({ referralsEnabled }: { referralsEnabled: boolean }) {
  const { t } = useLocale();
  const [enabled, setEnabled] = useState(referralsEnabled);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !enabled;
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralsEnabled: next }),
    });
    setSaving(false);
    if (res.ok) setEnabled(next);
  }

  return (
    <div className="admin-settings-panel">
      <h2 className="auth-title" style={{ fontSize: "1.1rem" }}>
        {t.admin.settings}
      </h2>
      <label className="admin-toggle-row">
        <input type="checkbox" checked={enabled} disabled={saving} onChange={toggle} />
        <span>{t.admin.referralsEnabled}</span>
      </label>
    </div>
  );
}
