"use client";

import { useLocale } from "@/components/LocaleProvider";

export function TrustBar() {
  const { t } = useLocale();
  const items = [
    { icon: "🇩🇪", label: t.trustBar.quality },
    { icon: "🚚", label: t.trustBar.shipping },
    { icon: "🔒", label: t.trustBar.payment },
    { icon: "↩️", label: t.trustBar.returns },
  ];

  return (
    <section className="trust-bar">
      {items.map((item, i) => (
        <div className="trust-bar-item" key={i}>
          <span className="trust-bar-icon">{item.icon}</span>
          <span className="trust-bar-label">{item.label}</span>
        </div>
      ))}
    </section>
  );
}
