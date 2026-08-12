"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function PoliciesPage() {
  const { t } = useLocale();
  const sections = [
    { key: "shipping", label: t.account.policies.shipping },
    { key: "returns", label: t.account.policies.returns },
    { key: "privacy", label: t.account.policies.privacy },
  ];

  return (
    <div>
      <h1 className="auth-title">{t.account.sidebar.policies}</h1>
      <div className="policy-list">
        {sections.map((s) => (
          <div className="policy-card" key={s.key}>
            <h2>{s.label}</h2>
            <p className="auth-sub">{t.account.comingSoonDesc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
