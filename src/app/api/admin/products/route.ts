import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { productSchema, normalizeProductInput } from "@/lib/productSchema";

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const existingSlug = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (existingSlug) {
    return NextResponse.json({ error: "SLUG_EXISTS" }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: { ...normalizeProductInput(parsed.data), icon: "box" },
    select: { id: true, slug: true },
  });

  return NextResponse.json(product, { status: 201 });
}
