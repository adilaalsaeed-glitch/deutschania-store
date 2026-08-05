import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (ids.length === 0) {
    return NextResponse.json({ products: [] });
  }

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
      categoryKey: true,
      category: { select: { key: true, label: true, icon: true, color: true } },
    },
  });

  // preserve the caller's ordering (findMany with `in` doesn't guarantee it)
  const ordered = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  return NextResponse.json({ products: ordered });
}
