// Loyalty points: 1 point per 1 EUR actually paid (post-discount), 100 points = 1 EUR redemption
// value (1 point = 1 cent), no expiration. Points are always computed in EUR cents — the app's
// only stored currency (see currency.ts) — regardless of the currency shown to the shopper.

export const POINTS_PER_EUR = 1; // earning rate: 1 point per 100 cents paid
export const CENTS_PER_POINT = 1; // redemption rate: 1 point removes 1 cent from the total
export const MIN_REDEEM_POINTS = 100; // smallest redemption allowed (== 1 EUR of value)
export const MAX_REDEEM_RATIO = 0.05; // points can cover at most 5% of the order subtotal

// Points earned when an order is confirmed PAID, based on the amount actually charged
// (subtotal minus any points discount already applied).
export function pointsEarnedForPaidCents(paidCents: number): number {
  return Math.floor(paidCents / 100) * POINTS_PER_EUR;
}

// The most points a shopper is allowed to redeem against an order of this subtotal, capped by
// both their balance and the 5% ceiling. Returns 0 if the order is too small for the cap to
// reach the 100-point minimum (i.e. redemption isn't offered at all on that order).
export function maxRedeemablePoints(subtotalCents: number, availableBalance: number): number {
  const capPoints = Math.floor((subtotalCents * MAX_REDEEM_RATIO) / CENTS_PER_POINT);
  const max = Math.min(capPoints, availableBalance);
  return max >= MIN_REDEEM_POINTS ? max : 0;
}

export type PointsValidationError = "POINTS_BELOW_MINIMUM" | "POINTS_INSUFFICIENT_BALANCE" | "POINTS_EXCEEDS_CAP";

// Validates a requested redemption amount against balance + the per-order cap.
// Returns null when valid, or the specific error code otherwise.
export function validateRedemption(
  pointsToRedeem: number,
  subtotalCents: number,
  availableBalance: number
): PointsValidationError | null {
  if (pointsToRedeem < MIN_REDEEM_POINTS) return "POINTS_BELOW_MINIMUM";
  if (pointsToRedeem > availableBalance) return "POINTS_INSUFFICIENT_BALANCE";
  const capPoints = Math.floor((subtotalCents * MAX_REDEEM_RATIO) / CENTS_PER_POINT);
  if (pointsToRedeem > capPoints) return "POINTS_EXCEEDS_CAP";
  return null;
}
