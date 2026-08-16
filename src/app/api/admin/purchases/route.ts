import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const purchases = await prisma.purchase.findMany({ orderBy: { purchaseDate: "desc" } });
  return NextResponse.json({ purchases });
}

const createSchema = z.object({
  purchaseDate: z.string().min(1), // ISO date string from a <input type="date">
  supplierName: z.string().min(1).max(200),
  productName: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(1_000_000),
  totalCostCents: z.number().int().min(0).max(100_000_000_00),
  shippingCostCents: z.number().int().min(0).max(100_000_000_00).optional(),
  customsCostCents: z.number().int().min(0).max(100_000_000_00).optional(),
  notes: z.string().max(2000).optional(),
  attachmentUrl: z.string().url().optional(),
  productId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const purchase = await prisma.purchase.create({
    data: {
      purchaseDate: new Date(parsed.data.purchaseDate),
      supplierName: parsed.data.supplierName,
      productName: parsed.data.productName,
      quantity: parsed.data.quantity,
      totalCostCents: parsed.data.totalCostCents,
      shippingCostCents: parsed.data.shippingCostCents ?? null,
      customsCostCents: parsed.data.customsCostCents ?? null,
      notes: parsed.data.notes || null,
      attachmentUrl: parsed.data.attachmentUrl || null,
      productId: parsed.data.productId || null,
      createdByUserId: session.user.id,
    },
  });

  return NextResponse.json({ id: purchase.id }, { status: 201 });
}
