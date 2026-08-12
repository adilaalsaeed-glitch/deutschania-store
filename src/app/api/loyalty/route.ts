import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const [user, transactions] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { loyaltyPoints: true } }),
    prisma.loyaltyTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { order: { select: { orderNumber: true } } },
    }),
  ]);

  return NextResponse.json({
    balance: user?.loyaltyPoints ?? 0,
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      points: t.points,
      orderNumber: t.order?.orderNumber ?? null,
      createdAt: t.createdAt,
    })),
  });
}
