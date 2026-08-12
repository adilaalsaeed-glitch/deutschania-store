// Each successful referral (referrer's link -> friend registers -> friend's first order is PAID)
// mints one coupon of this value for each side (see lib/coupons.ts for shared coupon helpers).
export const REFERRAL_COUPON_VALUE_CENTS = 700; // €7

// Prefer the canonical site URL (same value NextAuth itself uses) over a per-request origin,
// so the link shown is stable regardless of which host served the request.
export function siteOrigin(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export function referralUrl(origin: string, referrerId: string): string {
  return `${origin}/register?ref=${referrerId}`;
}
