// Per-country postal code patterns, keyed by ISO 3166-1 alpha-2. Not every SUPPORTED_COUNTRIES
// entry needs one here - a country with no rule defined simply isn't validated beyond presence
// (see isPostalCodeValid). Germany (Deutsche Post) uses a plain 5-digit code with no
// regional-prefix structure to check.
const POSTAL_PATTERNS: Record<string, RegExp> = {
  DE: /^\d{5}$/,
};

// Countries with no postal/ZIP code system at all (P.O.-Box-only mail delivery, no street-address
// postal code ever assigned) — the field is optional for them rather than validated. Empty for
// now; kept as a list (not a single hardcoded check) so a future country without one can be added
// without touching the validation logic itself.
export const COUNTRIES_WITHOUT_POSTAL_SYSTEM: readonly string[] = [] as const;

export function hasRealPostalSystem(country: string): boolean {
  return country !== "" && !COUNTRIES_WITHOUT_POSTAL_SYSTEM.includes(country);
}

// Central check used by both the checkout page (live UI feedback) and the checkout API
// (server-side enforcement) - a country with no postal system always passes, one with no pattern
// defined here isn't blocked on it, otherwise the value must match that country's pattern.
export function isPostalCodeValid(country: string, postal: string): boolean {
  if (!hasRealPostalSystem(country)) return true;
  const pattern = POSTAL_PATTERNS[country];
  if (!pattern) return true;
  return pattern.test(postal.trim());
}
