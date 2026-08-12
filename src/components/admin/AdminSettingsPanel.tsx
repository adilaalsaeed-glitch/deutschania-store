"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

export function AdminSettingsPanel({
  referralsEnabled,
  contentCouponEnabled,
  contentCouponPercentage,
  contentCouponMinOrderCents,
}: {
  referralsEnabled: boolean;
  contentCouponEnabled: boolean;
  contentCouponPercentage: number;
  contentCouponMinOrderCents: number;
}) {
  const { t } = useLocale();
  const [referrals, setReferrals] = useState(referralsEnabled);
  const [contentCoupon, setContentCoupon] = useState(contentCouponEnabled);
  const [percentage, setPercentage] = useState(contentCouponPercentage);
  const [minOrderEuros, setMinOrderEuros] = useState(contentCouponMinOrderCents / 100);
  const [saving, setSaving] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    return res.ok;
  }

  async function toggleReferrals() {
    const next = !referrals;
    if (await patch({ referralsEnabled: next })) setReferrals(next);
  }

  async function toggleContentCoupon() {
    const next = !contentCoupon;
    if (await patch({ contentCouponEnabled: next })) setContentCoupon(next);
  }

  async function saveTerms() {
    await patch({
      contentCouponPercentage: percentage,
      contentCouponMinOrderCents: Math.round(minOrderEuros * 100),
    });
  }

  return (
    <div className="admin-settings-panel">
      <h2 className="auth-title" style={{ fontSize: "1.1rem" }}>
        {t.admin.settings}
      </h2>
      <label className="admin-toggle-row">
        <input type="checkbox" checked={referrals} disabled={saving} onChange={toggleReferrals} />
        <span>{t.admin.referralsEnabled}</span>
      </label>
      <label className="admin-toggle-row" style={{ marginTop: 10 }}>
        <input type="checkbox" checked={contentCoupon} disabled={saving} onChange={toggleContentCoupon} />
        <span>{t.admin.contentCouponEnabled}</span>
      </label>
      <div className="admin-terms-row">
        <div className="field">
          <label>{t.admin.contentCouponPercentageLabel}</label>
          <input
            type="number"
            min={1}
            max={100}
            value={percentage}
            onChange={(e) => setPercentage(Number(e.target.value))}
            onBlur={saveTerms}
          />
        </div>
        <div className="field">
          <label>{t.admin.contentCouponMinOrderLabel}</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={minOrderEuros}
            onChange={(e) => setMinOrderEuros(Number(e.target.value))}
            onBlur={saveTerms}
          />
        </div>
      </div>
    </div>
  );
}
