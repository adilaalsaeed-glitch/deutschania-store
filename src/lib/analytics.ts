import { prisma } from "@/lib/db";
import type { ProductListItem } from "@/types/product";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";

export { LOW_STOCK_THRESHOLD };

export async function getTotalRevenueCents(): Promise<number> {
  const result = await prisma.order.aggregate({
    where: { status: "PAID" },
    _sum: { totalCents: true },
  });
  return result._sum.totalCents ?? 0;
}

export async function getTotalPaidOrders(): Promise<number> {
  return prisma.order.count({ where: { status: "PAID" } });
}

export type TopSellingProduct = ProductListItem & { unitsSold: number };

// Ranked by units sold across PAID orders only (matches how revenue/order counts above are
// scoped - a PENDING or FAILED order never actually moved stock, see the webhook).
export async function getTopSellingProducts(limit = 8): Promise<TopSellingProduct[]> {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { productId: { not: null }, order: { status: "PAID" } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  const ids = grouped.map((g) => g.productId).filter((id): id is string => id !== null);
  if (ids.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      slug: true,
      brand: true,
      name: true,
      priceCents: true,
      currency: true,
      icon: true,
      imageUrl: true,
      origin: true,
      categoryKey: true,
      featured: true,
      stockQuantity: true,
      category: { select: { key: true, label: true, icon: true, color: true } },
    },
  });

  const unitsById = new Map(grouped.map((g) => [g.productId, g._sum.quantity ?? 0]));
  return (products as unknown as ProductListItem[])
    .map((p) => ({ ...p, unitsSold: unitsById.get(p.id) ?? 0 }))
    .sort((a, b) => b.unitsSold - a.unitsSold);
}

export type LowStockProduct = {
  id: string;
  slug: string;
  brand: string;
  name: ProductListItem["name"];
  imageUrl: string | null;
  icon: string;
  stockQuantity: number;
};

export async function getLowStockProducts(threshold = LOW_STOCK_THRESHOLD): Promise<LowStockProduct[]> {
  return prisma.product.findMany({
    where: { stockQuantity: { lte: threshold } },
    orderBy: { stockQuantity: "asc" },
    select: { id: true, slug: true, brand: true, name: true, imageUrl: true, icon: true, stockQuantity: true },
  }) as unknown as LowStockProduct[];
}
