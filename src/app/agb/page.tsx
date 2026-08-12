import { cookies } from "next/headers";
import { LegalPage } from "@/components/legal/LegalPage";
import { agb } from "@/content/legal/agb";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";

export default async function AgbPage() {
  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);

  return <LegalPage content={agb[locale]} homeLabel={t.nav.home} />;
}
