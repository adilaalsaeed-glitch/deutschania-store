import { randomBytes } from "crypto";

// Shared by every coupon source (referral, content-coupon, ...). Not meant to be typed in by
// hand (no checkout redemption yet), so this just needs to be unique and reasonably opaque.
export function generateCouponCode(prefix: string): string {
  return `${prefix}-${randomBytes(6).toString("hex").toUpperCase()}`;
}

export const COUPON_EXPIRY_DAYS = 60; // same validity window across all coupon sources

export function couponExpiryDate(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + COUPON_EXPIRY_DAYS);
  return d;
}
