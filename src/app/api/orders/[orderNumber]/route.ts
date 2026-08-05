import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Keyed by the random order number rather than a sequential id so it isn't easily guessable.
// For a production build, also check the requester owns the order (session user or a signed token).
export async function GET(_request: Request, ctx: RouteContext<"/api/orders/[orderNumber]">) {
  const { orderNumber } = await ctx.params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      orderNumber: true,
      status: true,
      totalCents: true,
      currency: true,
      email: true,
      createdAt: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(order);
}
