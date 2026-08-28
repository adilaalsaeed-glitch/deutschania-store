import type { Locale } from "@/i18n/config";

// The only markets this storefront currently ships to. Adding a country later means adding one
// entry here — the registration and checkout forms, and their server-side validation, all read
// from this single list.
export const SUPPORTED_COUNTRIES = [
  { code: "DE", flag: "🇩🇪", dialCode: "+49", name: { ar: "ألمانيا", de: "Deutschland", en: "Germany" } },
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
// any leading zero (e.g. "01701234567" -> "+491701234567") since that's how numbers are commonly
// written locally but not how they're written in E.164-ish international form.
export function combinePhone(code: CountryCode | "", localNumber: string): string {
  const digits = localNumber.replace(/\D/g, "").replace(/^0+/, "");
  return code ? `${dialCodeFor(code)}${digits}` : digits;
}

// Inverse of combinePhone, for pre-filling an edit form from a value stored as
// dial-code + local number (e.g. "+491701234567" -> { country: "DE", localNumber: "1701234567" }).
export function splitPhone(value: string): { country: CountryCode | ""; localNumber: string } {
  for (const c of SUPPORTED_COUNTRIES) {
    if (value.startsWith(c.dialCode)) {
      return { country: c.code, localNumber: value.slice(c.dialCode.length) };
    }
  }
  return { country: "", localNumber: value };
}
