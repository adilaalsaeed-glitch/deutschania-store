import type { CountryCode } from "@/data/countries";

// Saudi Post (SPL) assigns the first digit of every 5-digit postal code to one of eight
// administrative postal regions - 0 and 9 are never issued. This is the real, documented
// structure of the Saudi postal system (not a full district-level lookup - Saudi Post's
// complete district table has thousands of entries and isn't practically embeddable as a
// static file, but validating the regional prefix is a genuine structural check, not just a
// digit-count check).
// Source: https://en.wikipedia.org/wiki/Postal_codes_in_Saudi_Arabia
const SAUDI_REGION_BY_PREFIX: Record<string, string> = {
  "1": "Riyadh Region",
  "2": "Makkah Region",
  "3": "Eastern Province",
  "4": "Medina & Tabuk",
  "5": "Qassim & Ha'il",
  "6": "Asir, Najran & Al Bahah",
  "7": "Northern Borders & Al Jawf",
  "8": "Jizan",
};

// The UAE and Qatar have no postal/ZIP code system at all - both countries deliver mail
// exclusively via P.O. Box, with no street-address postal code ever assigned. There is no
// "official range" to validate against for these two, unlike Saudi Arabia. The postal field
// is treated as optional for them (see hasRealPostalSystem below) rather than validated
// against a fabricated range.
export const COUNTRIES_WITHOUT_POSTAL_SYSTEM: readonly CountryCode[] = ["AE", "QA"] as const;

export function hasRealPostalSystem(country: CountryCode | ""): boolean {
  return country === "SA";
}

export function isValidSaudiPostalCode(postal: string): boolean {
  const digits = postal.trim();
  if (!/^\d{5}$/.test(digits)) return false;
  return digits[0] in SAUDI_REGION_BY_PREFIX;
}

export function saudiPostalRegion(postal: string): string | null {
  const digits = postal.trim();
  if (!/^\d{5}$/.test(digits)) return null;
  return SAUDI_REGION_BY_PREFIX[digits[0]] ?? null;
}

// Central check used by both the checkout page (live UI feedback) and the checkout API
// (server-side enforcement) - AE/QA always pass (no system to validate against), SA must
// match the regional-prefix structure, blank is only valid for countries without a system.
export function isPostalCodeValid(country: CountryCode | "", postal: string): boolean {
  if (!hasRealPostalSystem(country)) return true;
  return isValidSaudiPostalCode(postal);
}
