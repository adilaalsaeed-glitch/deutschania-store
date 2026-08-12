import { prisma } from "@/lib/db";

const REFERRALS_ENABLED_KEY = "referrals_enabled";
const CONTENT_COUPON_ENABLED_KEY = "content_coupon_enabled";
const CONTENT_COUPON_PERCENTAGE_KEY = "content_coupon_percentage";
const CONTENT_COUPON_MIN_ORDER_CENTS_KEY = "content_coupon_min_order_cents";
const TESTIMONIALS_ENABLED_KEY = "testimonials_enabled";

const CONTENT_COUPON_PERCENTAGE_DEFAULT = 10;
const CONTENT_COUPON_MIN_ORDER_CENTS_DEFAULT = 5000; // €50

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

// Off by default: absence of the row (pre-launch, or before an admin ever touches the toggle)
// means disabled, not enabled.
export async function isReferralsEnabled(): Promise<boolean> {
  const value = await getSetting(REFERRALS_ENABLED_KEY);
  return value === "true";
}

export async function setReferralsEnabled(enabled: boolean): Promise<void> {
  await setSetting(REFERRALS_ENABLED_KEY, enabled ? "true" : "false");
}

export async function isContentCouponEnabled(): Promise<boolean> {
  const value = await getSetting(CONTENT_COUPON_ENABLED_KEY);
  return value === "true";
}

export async function setContentCouponEnabled(enabled: boolean): Promise<void> {
  await setSetting(CONTENT_COUPON_ENABLED_KEY, enabled ? "true" : "false");
}

// The percentage and minimum order are admin-editable (per the spec's "قابل للتعديل من لوحة
// التحكم") rather than hardcoded, so changing them never needs a deploy.
export async function getContentCouponTerms(): Promise<{ percentage: number; minOrderCents: number }> {
  const [percentageRaw, minOrderRaw] = await Promise.all([
    getSetting(CONTENT_COUPON_PERCENTAGE_KEY),
    getSetting(CONTENT_COUPON_MIN_ORDER_CENTS_KEY),
  ]);
  const percentage = percentageRaw ? Number(percentageRaw) : CONTENT_COUPON_PERCENTAGE_DEFAULT;
  const minOrderCents = minOrderRaw ? Number(minOrderRaw) : CONTENT_COUPON_MIN_ORDER_CENTS_DEFAULT;
  return {
    percentage: Number.isFinite(percentage) ? percentage : CONTENT_COUPON_PERCENTAGE_DEFAULT,
    minOrderCents: Number.isFinite(minOrderCents) ? minOrderCents : CONTENT_COUPON_MIN_ORDER_CENTS_DEFAULT,
  };
}

export async function setContentCouponTerms(terms: { percentage: number; minOrderCents: number }): Promise<void> {
  await Promise.all([
    setSetting(CONTENT_COUPON_PERCENTAGE_KEY, String(terms.percentage)),
    setSetting(CONTENT_COUPON_MIN_ORDER_CENTS_KEY, String(terms.minOrderCents)),
  ]);
}

export async function isTestimonialsEnabled(): Promise<boolean> {
  const value = await getSetting(TESTIMONIALS_ENABLED_KEY);
  return value === "true";
}

export async function setTestimonialsEnabled(enabled: boolean): Promise<void> {
  await setSetting(TESTIMONIALS_ENABLED_KEY, enabled ? "true" : "false");
}

export { REFERRALS_ENABLED_KEY, CONTENT_COUPON_ENABLED_KEY, TESTIMONIALS_ENABLED_KEY };
