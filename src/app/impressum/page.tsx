import { cookies } from "next/headers";
import { LegalPage } from "@/components/legal/LegalPage";
import { impressum } from "@/content/legal/impressum";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";

export default async function ImpressumPage() {
  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);

  return <LegalPage content={impressum[locale]} homeLabel={t.nav.home} />;
}
