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

const KLEINUNTERNEHMER_ENABLED_KEY = "invoice_kleinunternehmer_enabled";
const STANDARD_TAX_RATE_PERCENT_KEY = "invoice_standard_tax_rate_percent";
const STANDARD_TAX_RATE_PERCENT_DEFAULT = 19; // Germany's standard VAT rate

// On by default: tax status is pending accountant/IHK confirmation (per the business owner),
// so invoices default to the §19 UStG small-business exemption (0% tax) until this is
// explicitly turned off from the admin settings panel.
export async function isKleinunternehmerEnabled(): Promise<boolean> {
  const value = await getSetting(KLEINUNTERNEHMER_ENABLED_KEY);
  return value === null ? true : value === "true";
}

export async function setKleinunternehmerEnabled(enabled: boolean): Promise<void> {
  await setSetting(KLEINUNTERNEHMER_ENABLED_KEY, enabled ? "true" : "false");
}

// Only applied when the Kleinunternehmer exemption above is off.
export async function getStandardTaxRatePercent(): Promise<number> {
  const value = await getSetting(STANDARD_TAX_RATE_PERCENT_KEY);
  const parsed = value ? Number(value) : STANDARD_TAX_RATE_PERCENT_DEFAULT;
  return Number.isFinite(parsed) ? parsed : STANDARD_TAX_RATE_PERCENT_DEFAULT;
}

export async function setStandardTaxRatePercent(percent: number): Promise<void> {
  await setSetting(STANDARD_TAX_RATE_PERCENT_KEY, String(percent));
}

export { REFERRALS_ENABLED_KEY, CONTENT_COUPON_ENABLED_KEY, TESTIMONIALS_ENABLED_KEY };
