import { cookies } from "next/headers";
import { LegalPage } from "@/components/legal/LegalPage";
import { dateneinstellungen } from "@/content/legal/dateneinstellungen";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";

export default async function DateneinstellungenPage() {
  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);

  return <LegalPage content={dateneinstellungen[locale]} homeLabel={t.nav.home} />;
}
