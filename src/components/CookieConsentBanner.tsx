"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { writeConsent, type ConsentRecord } from "@/lib/cookieConsent";
import { CookiePreferencesForm } from "@/components/CookiePreferencesForm";

// Mounted once in the root layout. initialConsent comes from the real cookie, read server-side
// (see layout.tsx) - so a returning visitor's already-made decision is reflected in the very
// first server-rendered HTML, with no flash of the banner while client JS catches up.
export function CookieConsentBanner({ initialConsent }: { initialConsent: ConsentRecord | null }) {
  const { t } = useLocale();
  const [consent, setConsent] = useState(initialConsent);
  const [customizing, setCustomizing] = useState(false);

  if (consent) return null;

  function decide(analytics: boolean, marketing: boolean) {
    setConsent(writeConsent({ analytics, marketing }));
  }

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label={t.cookieConsent.bannerAriaLabel}>
      <div className="cookie-banner-inner">
        {!customizing ? (
          <>
            <p className="cookie-banner-text">
              {t.cookieConsent.bannerText}{" "}
              <Link href="/dateneinstellungen">{t.cookieConsent.learnMore}</Link>
            </p>
            <div className="cookie-banner-actions">
              <button type="button" className="btn btn-ghost-outline" onClick={() => decide(false, false)}>
                {t.cookieConsent.rejectAll}
              </button>
              <button type="button" className="btn btn-ghost-outline" onClick={() => setCustomizing(true)}>
                {t.cookieConsent.customize}
              </button>
              <button type="button" className="btn btn-brass" onClick={() => decide(true, true)}>
                {t.cookieConsent.acceptAll}
              </button>
            </div>
          </>
        ) : (
          <CookiePreferencesForm initialConsent={consent} onSaved={setConsent} />
        )}
      </div>
    </div>
  );
}
