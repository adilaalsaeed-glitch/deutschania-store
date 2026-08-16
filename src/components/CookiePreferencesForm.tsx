"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { writeConsent, type ConsentRecord } from "@/lib/cookieConsent";

// Shared by the first-visit banner's "Customize" panel and the /dateneinstellungen page (always
// available, "change your mind anytime"). initialConsent comes from the real cookie, read
// server-side by the caller (layout.tsx / dateneinstellungen/page.tsx) - see CookieConsentBanner
// for why that matters.
export function CookiePreferencesForm({
  initialConsent,
  onSaved,
}: {
  initialConsent: ConsentRecord | null;
  onSaved?: (record: ConsentRecord) => void;
}) {
  const { t } = useLocale();
  const [consent, setConsent] = useState(initialConsent);
  const [pending, setPending] = useState<{ analytics: boolean; marketing: boolean } | null>(null);

  const analytics = pending ? pending.analytics : (consent?.analytics ?? false);
  const marketing = pending ? pending.marketing : (consent?.marketing ?? false);

  function save(next: { analytics: boolean; marketing: boolean }) {
    const record = writeConsent(next);
    setConsent(record);
    setPending(null);
    onSaved?.(record);
  }

  return (
    <div className="cookie-prefs">
      <div className="cookie-pref-row">
        <div>
          <strong>{t.cookieConsent.necessaryTitle}</strong>
          <p>{t.cookieConsent.necessaryDesc}</p>
        </div>
        <span className="cookie-pref-locked">{t.cookieConsent.alwaysOn}</span>
      </div>
      <div className="cookie-pref-row">
        <div>
          <strong>{t.cookieConsent.analyticsTitle}</strong>
          <p>{t.cookieConsent.analyticsDesc}</p>
        </div>
        <label className="cookie-toggle">
          <input
            type="checkbox"
            checked={analytics}
            onChange={(e) => setPending({ analytics: e.target.checked, marketing })}
          />
          <span />
        </label>
      </div>
      <div className="cookie-pref-row">
        <div>
          <strong>{t.cookieConsent.marketingTitle}</strong>
          <p>{t.cookieConsent.marketingDesc}</p>
        </div>
        <label className="cookie-toggle">
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setPending({ analytics, marketing: e.target.checked })}
          />
          <span />
        </label>
      </div>
      <div className="cookie-pref-actions">
        <button type="button" className="btn btn-ghost-outline" onClick={() => save({ analytics: false, marketing: false })}>
          {t.cookieConsent.rejectAll}
        </button>
        <button type="button" className="btn btn-brass" onClick={() => save({ analytics, marketing })}>
          {t.cookieConsent.savePreferences}
        </button>
      </div>
      {consent && !pending && (
        <p className="form-note">
          {t.cookieConsent.lastUpdated} {new Date(consent.decidedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
