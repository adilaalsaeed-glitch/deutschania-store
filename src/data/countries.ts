import type { Locale } from "@/i18n/config";

// The only markets this storefront currently ships to. Adding a country later means adding one
// entry here — the registration and checkout forms, and their server-side validation, all read
// from this single list.
export const SUPPORTED_COUNTRIES = [
  { code: "SA", flag: "🇸🇦", dialCode: "+966", name: { ar: "السعودية", de: "Saudi-Arabien", en: "Saudi Arabia" } },
  { code: "AE", flag: "🇦🇪", dialCode: "+971", name: { ar: "الإمارات", de: "Vereinigte Arabische Emirate", en: "United Arab Emirates" } },
  { code: "QA", flag: "🇶🇦", dialCode: "+974", name: { ar: "قطر", de: "Katar", en: "Qatar" } },
] as const;

export type CountryCode = (typeof SUPPORTED_COUNTRIES)[number]["code"];

export function isSupportedCountry(value: string): value is CountryCode {
  return SUPPORTED_COUNTRIES.some((c) => c.code === value);
}

export function countryName(code: CountryCode, locale: Locale): string {
  return SUPPORTED_COUNTRIES.find((c) => c.code === code)!.name[locale];
}

export function dialCodeFor(code: CountryCode | ""): string {
  return code ? SUPPORTED_COUNTRIES.find((c) => c.code === code)!.dialCode : "";
}

// Combines the dial code (from the selected country) with a locally-typed number, stripping
// any leading zero (e.g. "0501234567" -> "+966501234567") since that's how numbers are commonly
// written locally but not how they're written in E.164-ish international form.
export function combinePhone(code: CountryCode | "", localNumber: string): string {
  const digits = localNumber.replace(/\D/g, "").replace(/^0+/, "");
  return code ? `${dialCodeFor(code)}${digits}` : digits;
}
