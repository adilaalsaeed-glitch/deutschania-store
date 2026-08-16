// TTDSG §25 + CJEU Planet49: no tracking/analytics/marketing tool may run before the visitor has
// explicitly opted in - a pre-checked box or "continue browsing = consent" doesn't count, and
// reject must be as easy to reach as accept. "necessary" cookies (session, CSRF, cart, locale -
// see the dateneinstellungen page) are exempt from consent entirely since the site can't
// function without them, so this only ever gates analytics/marketing.
//
// There is no analytics or marketing script wired into the app yet (grep for gtag/fbq/
// google-analytics turns up nothing) - this module is the gate future ones must call through
// before injecting anything, so consent is enforced by construction rather than by remembering
// to add a check when that day comes:
//
//   import { hasConsent } from "@/lib/cookieConsent";
//   if (hasConsent("analytics")) { /* inject the script */ }
//
// parseConsentCookie is shared by client and server: the root layout and the dateneinstellungen
// page (both Server Components, already reading the `locale` cookie the same way) read the real
// cookie via next/headers and pass the parsed decision down as a prop, so the banner's very first
// server-rendered HTML already reflects a returning visitor's real choice - no flash of the
// banner on every reload before client JS catches up.

export type ConsentCategory = "analytics" | "marketing";

export type ConsentRecord = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

export const COOKIE_NAME = "cookie_consent";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function parseConsentCookie(raw: string | undefined | null): ConsentRecord | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.decidedAt) return parsed as ConsentRecord;
  } catch {
    // malformed/tampered cookie - treat as "no decision yet" rather than throwing
  }
  return null;
}

// Client-only imperative read (for a future analytics script deciding whether to load itself).
export function readConsent(): ConsentRecord | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? parseConsentCookie(decodeURIComponent(match[1])) : null;
}

export function hasConsent(category: ConsentCategory): boolean {
  return readConsent()?.[category] === true;
}

export function writeConsent(categories: { analytics: boolean; marketing: boolean }): ConsentRecord {
  const record: ConsentRecord = { necessary: true, ...categories, decidedAt: new Date().toISOString() };
  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(record))}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
  }
  return record;
}
