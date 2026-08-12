import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import countryNames from "i18n-iso-countries";
import ar from "i18n-iso-countries/langs/ar.json";
import de from "i18n-iso-countries/langs/de.json";
import en from "i18n-iso-countries/langs/en.json";
import type { Locale } from "@/i18n/config";

countryNames.registerLocale(ar);
countryNames.registerLocale(de);
countryNames.registerLocale(en);

export type CountryOption = {
  iso2: CountryCode;
  dialCode: string;
  name: Record<Locale, string>;
};

// Emoji flags render as plain "XX" letter pairs on Windows (Segoe UI Emoji has
// never shipped full flag glyph coverage), so we use the flag-icons SVG set instead -
// see the "fi fi-xx" class usage in PhoneInput.tsx and the @import in globals.css.
export function flagClass(iso2: string): string {
  return `fi fi-${iso2.toLowerCase()}`;
}

export const DEFAULT_COUNTRY_ISO2: CountryCode = "SA";

// Arab League members - shown first, since this store's core audience is Arab.
const ARAB_LEAGUE = new Set([
  "DZ", "BH", "KM", "DJ", "EG", "IQ", "JO", "KW", "LB", "LY",
  "MR", "MA", "OM", "PS", "QA", "SA", "SO", "SD", "SY", "TN", "AE", "YE",
]);

// EU member states - shown second, the store's other core market.
const EUROPEAN_UNION = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

let cache: CountryOption[] | null = null;

function buildCountries(): CountryOption[] {
  if (cache) return cache;

  const result: CountryOption[] = [];
  for (const iso2 of getCountries()) {
    const nameAr = countryNames.getName(iso2, "ar");
    const nameDe = countryNames.getName(iso2, "de");
    const nameEn = countryNames.getName(iso2, "en");
    // Skip codes with no real ISO 3166-1 country name (e.g. libphonenumber-js's
    // non-standard territory codes like "AC" for Ascension Island).
    if (!nameAr || !nameDe || !nameEn) continue;

    result.push({
      iso2,
      dialCode: getCountryCallingCode(iso2),
      name: { ar: nameAr, de: nameDe, en: nameEn },
    });
  }

  cache = result;
  return result;
}

export function getSortedCountries(locale: Locale): CountryOption[] {
  const all = buildCountries();
  const priority = all
    .filter((c) => ARAB_LEAGUE.has(c.iso2) || EUROPEAN_UNION.has(c.iso2))
    .sort((a, b) => a.name[locale].localeCompare(b.name[locale], locale));
  const rest = all
    .filter((c) => !ARAB_LEAGUE.has(c.iso2) && !EUROPEAN_UNION.has(c.iso2))
    .sort((a, b) => a.name[locale].localeCompare(b.name[locale], locale));

  return [...priority, ...rest];
}

export function getCountryByIso2(iso2: string): CountryOption | undefined {
  return buildCountries().find((c) => c.iso2 === iso2);
}

export function isCountryCode(value: string): value is CountryCode {
  return buildCountries().some((c) => c.iso2 === value);
}
