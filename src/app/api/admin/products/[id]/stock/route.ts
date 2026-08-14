import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const stockSchema = z.object({ stockQuantity: z.number().int().min(0).max(1_000_000) });

// Lightweight, focused endpoint for the admin product list's inline stock editor - the full
// PATCH /api/admin/products/[id] route requires the entire productSchema payload, which is
// unnecessary friction for changing a single number.
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/products/[id]/stock">) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = stockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: { stockQuantity: parsed.data.stockQuantity },
    select: { id: true, stockQuantity: true },
  });
  return NextResponse.json(product);
}
