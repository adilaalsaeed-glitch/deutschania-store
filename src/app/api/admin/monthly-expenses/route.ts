import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  description: z.string().min(1).max(200),
  amountCents: z.number().int().min(0).max(100_000_000_00),
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

  const expense = await prisma.monthlyExpense.create({
    data: {
      year: parsed.data.year,
      month: parsed.data.month,
      description: parsed.data.description,
      amountCents: parsed.data.amountCents,
      createdByUserId: session.user.id,
    },
  });

  return NextResponse.json({ id: expense.id }, { status: 201 });
}
