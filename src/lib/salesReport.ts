import { prisma } from "@/lib/db";
import { computePeriodRange } from "@/lib/accountingPeriod";
import { getLatestUnitCostsCentsMap } from "@/lib/productCost";
import type { Locale } from "@/i18n/config";

// Deliberately keyed off issuedAt (the actual calendar date), not the `year` field - that field
// is the invoice *numbering* year (which sequence the counter drew from), not necessarily the
// same thing everywhere the schema allows it to diverge. Every other query in this file also
// buckets by issuedAt, so this keeps the years list consistent with what it's a list of.
export async function getAvailableSalesYears(): Promise<number[]> {
  const rows = await prisma.$queryRaw<{ year: number }[]>`
    SELECT DISTINCT EXTRACT(YEAR FROM "issuedAt")::int AS year FROM invoices ORDER BY year DESC
  `;
  return rows.map((r) => r.year);
}

export type MonthTotals = {
  month: number; // 1-12
  netSubtotalCents: number;
  netTaxCents: number;
  netTotalCents: number; // gross sales minus Storno returns, already netted since Storno amounts are stored negative
  orderCount: number; // count of AUTO+MANUAL invoices (STORNO excluded - a return isn't a new order)
  returnsCount: number;
  returnsValueCents: number; // positive magnitude of what was returned
};

function emptyMonthTotals(month: number): MonthTotals {
  return { month, netSubtotalCents: 0, netTaxCents: 0, netTotalCents: 0, orderCount: 0, returnsCount: 0, returnsValueCents: 0 };
}

// Lightweight - just enough for the year view's chart and best/worst-month callouts. The heavier
// per-product/profit breakdown only runs for a single opened month (see getMonthDetail).
export async function getYearMonthlyTotals(year: number): Promise<MonthTotals[]> {
  const { from, to } = computePeriodRange(year, "year", 1);
  const invoices = await prisma.invoice.findMany({
    where: { issuedAt: { gte: from, lt: to } },
    select: { issuedAt: true, source: true, subtotalCents: true, taxCents: true, totalCents: true },
  });

  const months = Array.from({ length: 12 }, (_, i) => emptyMonthTotals(i + 1));
  for (const inv of invoices) {
    const bucket = months[inv.issuedAt.getUTCMonth()];
    bucket.netSubtotalCents += inv.subtotalCents;
    bucket.netTaxCents += inv.taxCents;
    bucket.netTotalCents += inv.totalCents;
    if (inv.source === "STORNO") {
      bucket.returnsCount += 1;
      bucket.returnsValueCents += -inv.totalCents;
    } else {
      bucket.orderCount += 1;
    }
  }
  return months;
}

// Single aggregate, used only for year-over-year growth comparison on the year page - doesn't
// need the per-month bucketing getYearMonthlyTotals does.
export async function getYearTotalRevenueCents(year: number): Promise<number> {
  const { from, to } = computePeriodRange(year, "year", 1);
  const agg = await prisma.invoice.aggregate({ where: { issuedAt: { gte: from, lt: to } }, _sum: { totalCents: true } });
  return agg._sum.totalCents ?? 0;
}

export type MonthProfitSummary = {
  month: number; // 1-12
  costCents: number;
  profitCents: number;
  hasProfitData: boolean; // false when this month had real revenue but none of it is attributable to a catalog product (see unattributedRevenueCents elsewhere in this file)
};

// Per-month profit breakdown for the year chart - same "known-cost subset" logic as
// getMonthDetail's profit calc, but bucketed across the whole year in one pass (3 queries total)
// instead of calling getMonthDetail 12 times, which would redo its heavier geo/top-products work
// the chart never uses.
export async function getYearMonthlyProfitTotals(year: number): Promise<MonthProfitSummary[]> {
  const { from, to } = computePeriodRange(year, "year", 1);

  const [invoices, autoInvoices, stornoInvoices] = await Promise.all([
    prisma.invoice.findMany({ where: { issuedAt: { gte: from, lt: to } }, select: { issuedAt: true, totalCents: true } }),
    prisma.invoice.findMany({
      where: { issuedAt: { gte: from, lt: to }, source: "AUTO" },
      select: {
        issuedAt: true,
        order: { select: { items: { select: { productId: true, quantity: true, priceCentsAtSale: true } } } },
      },
    }),
    prisma.invoice.findMany({
      where: { issuedAt: { gte: from, lt: to }, source: "STORNO" },
      select: {
        issuedAt: true,
        correctsInvoice: { select: { order: { select: { items: { select: { productId: true, quantity: true, priceCentsAtSale: true } } } } } },
      },
    }),
  ]);

  const totalRevenueByMonth = Array.from({ length: 12 }, () => 0);
  for (const inv of invoices) totalRevenueByMonth[inv.issuedAt.getUTCMonth()] += inv.totalCents;

  // month index -> productId -> {quantitySigned, revenueSignedCents}
  const activityByMonth: Map<string, { quantity: number; revenueCents: number }>[] = Array.from({ length: 12 }, () => new Map());
  function add(month: number, productId: string | null, quantitySigned: number, revenueSignedCents: number) {
    if (!productId) return;
    const bucket = activityByMonth[month];
    const existing = bucket.get(productId);
    if (existing) {
      existing.quantity += quantitySigned;
      existing.revenueCents += revenueSignedCents;
    } else {
      bucket.set(productId, { quantity: quantitySigned, revenueCents: revenueSignedCents });
    }
  }

  for (const inv of autoInvoices) {
    const m = inv.issuedAt.getUTCMonth();
    for (const item of inv.order?.items ?? []) add(m, item.productId, item.quantity, item.priceCentsAtSale * item.quantity);
  }
  for (const inv of stornoInvoices) {
    const m = inv.issuedAt.getUTCMonth();
    for (const item of inv.correctsInvoice?.order?.items ?? []) add(m, item.productId, -item.quantity, -(item.priceCentsAtSale * item.quantity));
  }

  const allProductIds = new Set<string>();
  activityByMonth.forEach((bucket) => bucket.forEach((_, productId) => allProductIds.add(productId)));
  const costMap = await getLatestUnitCostsCentsMap([...allProductIds]);

  const result: MonthProfitSummary[] = [];
  for (let m = 0; m < 12; m++) {
    let costCents = 0;
    let knownCostRevenueCents = 0;
    let attributedRevenueCents = 0;
    for (const [productId, activity] of activityByMonth[m]) {
      attributedRevenueCents += activity.revenueCents;
      const unitCost = costMap.get(productId);
      if (unitCost == null) continue;
      costCents += unitCost * activity.quantity;
      knownCostRevenueCents += activity.revenueCents;
    }
    const profitCents = knownCostRevenueCents - costCents;
    const totalRevenueCents = totalRevenueByMonth[m];
    const unattributedRevenueCents = Math.max(0, totalRevenueCents - attributedRevenueCents);
    const hasProfitData = !(totalRevenueCents > 0 && unattributedRevenueCents >= totalRevenueCents);
    result.push({ month: m + 1, costCents, profitCents, hasProfitData });
  }
  return result;
}

export type YearProfitSummary = {
  costCents: number; // total COGS across the year - sum over activity with a known cost
  profitCents: number; // knownCostRevenueCents - costCents
  profitMarginPercent: number | null; // profitCents as a % of knownCostRevenueCents - null when that revenue is 0
  productsWithUnknownCostCount: number; // distinct products sold this year with no purchase history at all
  unattributedRevenueCents: number; // revenue with no traceable product at all (MANUAL invoices, or a deleted product) - not the same as "known product, no purchase cost" above
};

// Same known-cost-subset logic as getMonthDetail's profit calc below, just over the full year in
// one pass instead of summing 12 separate getMonthDetail calls (which would re-run the heavier
// per-product/geo queries 12x for data this view never needs).
export async function getYearProfitSummary(year: number): Promise<YearProfitSummary> {
  const { from, to } = computePeriodRange(year, "year", 1);
  const [activity, revenueAgg] = await Promise.all([
    getProductActivityForRange(from, to),
    prisma.invoice.aggregate({ where: { issuedAt: { gte: from, lt: to } }, _sum: { totalCents: true } }),
  ]);
  const totalRevenueCents = revenueAgg._sum.totalCents ?? 0;
  const costMap = await getLatestUnitCostsCentsMap(activity.map((a) => a.productId));

  let costCents = 0;
  let knownCostRevenueCents = 0;
  let attributedRevenueCents = 0;
  let productsWithUnknownCostCount = 0;
  for (const a of activity) {
    attributedRevenueCents += a.revenueCents;
    const unitCost = costMap.get(a.productId);
    if (unitCost == null) {
      productsWithUnknownCostCount += 1;
      continue;
    }
    costCents += unitCost * a.quantity;
    knownCostRevenueCents += a.revenueCents;
  }
  const profitCents = knownCostRevenueCents - costCents;
  const profitMarginPercent = knownCostRevenueCents > 0 ? (profitCents / knownCostRevenueCents) * 100 : null;
  const unattributedRevenueCents = Math.max(0, totalRevenueCents - attributedRevenueCents);

  return { costCents, profitCents, profitMarginPercent, productsWithUnknownCostCount, unattributedRevenueCents };
}

export type ProductActivity = {
  productId: string;
  name: Record<Locale, string>;
  quantity: number; // net (returns subtracted)
  revenueCents: number; // net
};

// Only line items traceable back to a real catalog Product (via OrderItem.productId) can appear
// here - MANUAL invoices have no Order behind them at all, and a since-deleted product leaves
// OrderItem.productId null. Both are real sales revenue (counted in the month's totals above)
// but can't be attributed to a specific product for ranking or margin purposes.
async function getProductActivityForRange(from: Date, to: Date): Promise<ProductActivity[]> {
  const [autoInvoices, stornoInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: { issuedAt: { gte: from, lt: to }, source: "AUTO" },
      select: {
        order: { select: { items: { select: { productId: true, quantity: true, priceCentsAtSale: true, nameSnapshot: true } } } },
      },
    }),
    prisma.invoice.findMany({
      where: { issuedAt: { gte: from, lt: to }, source: "STORNO" },
      select: {
        correctsInvoice: {
          select: {
            order: { select: { items: { select: { productId: true, quantity: true, priceCentsAtSale: true, nameSnapshot: true } } } },
          },
        },
      },
    }),
  ]);

  const activity = new Map<string, ProductActivity>();
  function add(productId: string | null, name: unknown, quantitySigned: number, revenueSignedCents: number) {
    if (!productId) return;
    const existing = activity.get(productId);
    if (existing) {
      existing.quantity += quantitySigned;
      existing.revenueCents += revenueSignedCents;
    } else {
      activity.set(productId, { productId, name: name as Record<Locale, string>, quantity: quantitySigned, revenueCents: revenueSignedCents });
    }
  }

  for (const inv of autoInvoices) {
    for (const item of inv.order?.items ?? []) {
      add(item.productId, item.nameSnapshot, item.quantity, item.priceCentsAtSale * item.quantity);
    }
  }
  for (const inv of stornoInvoices) {
    for (const item of inv.correctsInvoice?.order?.items ?? []) {
      add(item.productId, item.nameSnapshot, -item.quantity, -(item.priceCentsAtSale * item.quantity));
    }
  }

  return [...activity.values()];
}

export type GeoCityBreakdown = { city: string; revenueCents: number; orderCount: number };
export type GeoCountryBreakdown = { country: string; revenueCents: number; orderCount: number; cities: GeoCityBreakdown[] };

// Sourced from Order.shippingAddress (the only place country/city is actually recorded) - so, like
// getProductActivityForRange, MANUAL invoices (no Order at all) simply have no geography to
// attribute and are left out here, even though their revenue is still counted in the month's
// totals above. STORNO returns net back out of whichever country/city the original order shipped
// to, same "trace back through correctsInvoice" pattern used for product activity.
async function getGeoBreakdownForRange(from: Date, to: Date): Promise<GeoCountryBreakdown[]> {
  const [autoInvoices, stornoInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: { issuedAt: { gte: from, lt: to }, source: "AUTO" },
      select: { totalCents: true, order: { select: { shippingAddress: true } } },
    }),
    prisma.invoice.findMany({
      where: { issuedAt: { gte: from, lt: to }, source: "STORNO" },
      select: { totalCents: true, correctsInvoice: { select: { order: { select: { shippingAddress: true } } } } },
    }),
  ]);

  type MutableBucket = { revenueCents: number; orderCount: number; cities: Map<string, { revenueCents: number; orderCount: number }> };
  const countries = new Map<string, MutableBucket>();

  function add(shippingAddress: unknown, amountCents: number, countsAsOrder: boolean) {
    const addr = shippingAddress as { country?: string; city?: string } | null;
    if (!addr?.country) return; // no Order behind this invoice (MANUAL) - nothing to attribute
    const country = addr.country;
    const city = addr.city?.trim() || "—";

    let countryBucket = countries.get(country);
    if (!countryBucket) {
      countryBucket = { revenueCents: 0, orderCount: 0, cities: new Map() };
      countries.set(country, countryBucket);
    }
    countryBucket.revenueCents += amountCents;
    if (countsAsOrder) countryBucket.orderCount += 1;

    let cityBucket = countryBucket.cities.get(city);
    if (!cityBucket) {
      cityBucket = { revenueCents: 0, orderCount: 0 };
      countryBucket.cities.set(city, cityBucket);
    }
    cityBucket.revenueCents += amountCents;
    if (countsAsOrder) cityBucket.orderCount += 1;
  }

  for (const inv of autoInvoices) {
    add(inv.order?.shippingAddress, inv.totalCents, true);
  }
  for (const inv of stornoInvoices) {
    // inv.totalCents is already negative (a Storno amount) - a return isn't counted as an order.
    add(inv.correctsInvoice?.order?.shippingAddress, inv.totalCents, false);
  }

  return [...countries.entries()]
    .map(([country, bucket]) => ({
      country,
      revenueCents: bucket.revenueCents,
      orderCount: bucket.orderCount,
      cities: [...bucket.cities.entries()]
        .map(([city, c]) => ({ city, revenueCents: c.revenueCents, orderCount: c.orderCount }))
        .sort((a, b) => b.revenueCents - a.revenueCents),
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents);
}

export type MonthDetail = MonthTotals & {
  year: number;
  grossSubtotalCents: number; // AUTO+MANUAL only, before returns
  grossTaxCents: number;
  grossTotalCents: number;
  avgOrderValueCents: number | null;
  growthPercentVsPrevMonth: number | null; // null when there's no comparable previous-month data
  topProducts: (ProductActivity & { unitCostCents: number | null })[]; // top 5 by quantity
  costCents: number; // total COGS - sum over activity with a known cost (see productsWithUnknownCostCount)
  profitCents: number; // sum over topProducts-eligible activity with a known cost - see productsWithUnknownCost
  profitMarginPercent: number | null; // profitCents as a % of the revenue it was computed from (knownCostRevenueCents) - null when that revenue is 0
  productsWithUnknownCostCount: number; // distinct products sold this month with no purchase history at all
  unattributedRevenueCents: number; // revenue with no traceable product at all (MANUAL invoices, or a deleted product) - not the same as "known product, no purchase cost" above
  geoBreakdown: GeoCountryBreakdown[]; // countries sorted by revenue, each with its cities sorted by revenue
};

export async function getMonthDetail(year: number, month: number): Promise<MonthDetail> {
  const { from, to } = computePeriodRange(year, "month", month);

  const invoices = await prisma.invoice.findMany({
    where: { issuedAt: { gte: from, lt: to } },
    select: { source: true, subtotalCents: true, taxCents: true, totalCents: true },
  });

  const totals = emptyMonthTotals(month);
  let grossSubtotalCents = 0;
  let grossTaxCents = 0;
  let grossTotalCents = 0;
  for (const inv of invoices) {
    totals.netSubtotalCents += inv.subtotalCents;
    totals.netTaxCents += inv.taxCents;
    totals.netTotalCents += inv.totalCents;
    if (inv.source === "STORNO") {
      totals.returnsCount += 1;
      totals.returnsValueCents += -inv.totalCents;
    } else {
      totals.orderCount += 1;
      grossSubtotalCents += inv.subtotalCents;
      grossTaxCents += inv.taxCents;
      grossTotalCents += inv.totalCents;
    }
  }
  const avgOrderValueCents = totals.orderCount > 0 ? Math.round(grossTotalCents / totals.orderCount) : null;

  // Previous month, which may roll back into the prior year.
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const { from: prevFrom, to: prevTo } = computePeriodRange(prevYear, "month", prevMonth);
  const prevInvoices = await prisma.invoice.findMany({
    where: { issuedAt: { gte: prevFrom, lt: prevTo } },
    select: { totalCents: true },
  });
  const prevNetTotalCents = prevInvoices.reduce((sum, inv) => sum + inv.totalCents, 0);
  const growthPercentVsPrevMonth =
    prevInvoices.length === 0 || prevNetTotalCents === 0
      ? null
      : ((totals.netTotalCents - prevNetTotalCents) / Math.abs(prevNetTotalCents)) * 100;

  const activity = await getProductActivityForRange(from, to);
  const geoBreakdown = await getGeoBreakdownForRange(from, to);
  const costMap = await getLatestUnitCostsCentsMap(activity.map((a) => a.productId));

  let costCents = 0;
  let knownCostRevenueCents = 0;
  let attributedRevenueCents = 0;
  let productsWithUnknownCostCount = 0;
  for (const a of activity) {
    attributedRevenueCents += a.revenueCents;
    const unitCost = costMap.get(a.productId);
    if (unitCost == null) {
      productsWithUnknownCostCount += 1;
      continue;
    }
    costCents += unitCost * a.quantity;
    knownCostRevenueCents += a.revenueCents;
  }
  const profitCents = knownCostRevenueCents - costCents;
  const profitMarginPercent = knownCostRevenueCents > 0 ? (profitCents / knownCostRevenueCents) * 100 : null;
  const unattributedRevenueCents = Math.max(0, totals.netTotalCents - attributedRevenueCents);

  const topProducts = [...activity]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
    .map((a) => ({ ...a, unitCostCents: costMap.get(a.productId) ?? null }));

  return {
    ...totals,
    year,
    grossSubtotalCents,
    grossTaxCents,
    grossTotalCents,
    avgOrderValueCents,
    growthPercentVsPrevMonth,
    topProducts,
    costCents,
    profitCents,
    profitMarginPercent,
    productsWithUnknownCostCount,
    unattributedRevenueCents,
    geoBreakdown,
  };
}
