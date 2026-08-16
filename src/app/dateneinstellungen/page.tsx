import { cookies } from "next/headers";
import { LegalPage } from "@/components/legal/LegalPage";
import { CookiePreferencesForm } from "@/components/CookiePreferencesForm";
import { parseConsentCookie, COOKIE_NAME as CONSENT_COOKIE_NAME } from "@/lib/cookieConsent";
import { dateneinstellungen } from "@/content/legal/dateneinstellungen";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";

export default async function DateneinstellungenPage() {
  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);
  const initialConsent = parseConsentCookie(jar.get(CONSENT_COOKIE_NAME)?.value);

  return (
    <LegalPage content={dateneinstellungen[locale]} homeLabel={t.nav.home}>
      <div className="legal-section">
        <h2>{t.cookieConsent.panelHeading}</h2>
        <CookiePreferencesForm initialConsent={initialConsent} />
      </div>
    </LegalPage>
  );
}
