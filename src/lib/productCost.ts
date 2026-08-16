import { prisma } from "@/lib/db";

// The real per-unit landed cost: product cost plus its share of shipping and customs, not just
// the bare product price - those two are optional on a Purchase row (older rows, or ones an admin
// didn't itemize, simply have neither), so they default to 0 rather than making the whole cost
// unknown.
function landedUnitCostCents(purchase: { totalCostCents: number; shippingCostCents: number | null; customsCostCents: number | null; quantity: number }): number {
  const totalLandedCents = purchase.totalCostCents + (purchase.shippingCostCents ?? 0) + (purchase.customsCostCents ?? 0);
  return Math.round(totalLandedCents / purchase.quantity);
}

// "Latest cost" rather than an average across purchase history - matches how a small store
// actually reasons about margin (what would it cost to restock today), and stays correct without
// needing to track a moving average as supplier prices change over time.
export async function getLatestUnitCostCents(productId: string): Promise<number | null> {
  const purchase = await prisma.purchase.findFirst({
    where: { productId },
    orderBy: { purchaseDate: "desc" },
  });
  if (!purchase || purchase.quantity <= 0) return null;
  return landedUnitCostCents(purchase);
}

// Batch form of the above for the sales report's profit calculation, which needs this for every
// product sold in a month rather than one at a time. Prisma's `distinct` on productId combined
// with an orderBy gives exactly "the latest row per product" in a single query.
export async function getLatestUnitCostsCentsMap(productIds: string[]): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();
  const latest = await prisma.purchase.findMany({
    where: { productId: { in: productIds } },
    distinct: ["productId"],
    orderBy: { purchaseDate: "desc" },
    select: { productId: true, totalCostCents: true, shippingCostCents: true, customsCostCents: true, quantity: true },
  });
  const map = new Map<string, number>();
  for (const p of latest) {
    if (!p.productId || p.quantity <= 0) continue;
    map.set(p.productId, landedUnitCostCents(p));
  }
  return map;
}
