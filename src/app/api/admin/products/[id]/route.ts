import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { productSchema, normalizeProductInput } from "@/lib/productSchema";

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/products/[id]">) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const existingSlug = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (existingSlug && existingSlug.id !== id) {
    return NextResponse.json({ error: "SLUG_EXISTS" }, { status: 409 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: normalizeProductInput(parsed.data),
  });
  return NextResponse.json(product);
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/products/[id]">) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await ctx.params;
  // Safe by design: order_items.productId is ON DELETE SET NULL, and OrderItem already
  // snapshots the product's name/price at time of purchase - deleting the product here
  // never corrupts past order records. The client warns the admin first if any exist.
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
