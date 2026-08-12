import { randomBytes } from "crypto";

// Each successful referral (referrer's link -> friend registers -> friend's first order is PAID)
// mints one coupon of this value for each side, valid for this many days.
export const REFERRAL_COUPON_VALUE_CENTS = 700; // €7
export const REFERRAL_COUPON_EXPIRY_DAYS = 60;

// Prefer the canonical site URL (same value NextAuth itself uses) over a per-request origin,
// so the link shown is stable regardless of which host served the request.
export function siteOrigin(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export function referralUrl(origin: string, referrerId: string): string {
  return `${origin}/register?ref=${referrerId}`;
}

// Not meant to be typed in by hand (no checkout redemption yet), so this just needs to be
// unique and reasonably opaque — not short/pretty.
export function generateCouponCode(): string {
  return `REF-${randomBytes(6).toString("hex").toUpperCase()}`;
}

export function couponExpiryDate(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + REFERRAL_COUPON_EXPIRY_DAYS);
  return d;
}
