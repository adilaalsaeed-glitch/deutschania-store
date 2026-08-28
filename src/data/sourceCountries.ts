import type { Locale } from "@/i18n/config";

// Countries products can be sourced from. Adding a new supplier country later means adding one
// entry here (no schema migration needed - Product.sourceCountry/Category.sourceCountry are
// plain strings, validated against this list at the app layer).
export const SOURCE_COUNTRIES = [
  { code: "CN", name: { ar: "الصين", de: "China", en: "China" } },
] as const;

export type SourceCountryCode = (typeof SOURCE_COUNTRIES)[number]["code"];

export function isSourceCountry(value: string): value is SourceCountryCode {
  return SOURCE_COUNTRIES.some((c) => c.code === value);
}

export function sourceCountryName(code: string, locale: Locale): string {
  return SOURCE_COUNTRIES.find((c) => c.code === code)?.name[locale] ?? code;
}

// Converts an ISO 3166-1 alpha-2 code to its flag emoji via regional indicator symbols (e.g.
// "CN" -> 🇨🇳), rather than a maintained per-country emoji lookup table - works for any valid
// code without needing an update every time SOURCE_COUNTRIES grows.
export function flagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}
