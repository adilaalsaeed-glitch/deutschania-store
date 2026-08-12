import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pointsEarnedForPaidCents } from "@/lib/loyalty";

// PayTabs calls this server-to-server once a payment finishes (independent of whether the
// customer's browser makes it back to the return URL). See:
// https://docs.paytabs.com/manuals/PT-API-Endpoints/Integration-Types-Manuals/Hosted-Payment-Page/
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.cart_id) {
    return NextResponse.json({ error: "Missing cart_id" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { orderNumber: body.cart_id } });
  if (!order) {
    return NextResponse.json({ error: "Unknown order" }, { status: 404 });
  }

  // PayTabs may call this webhook more than once for the same payment. Only PENDING orders can
  // still transition — an order already PAID/FAILED has already had its points earned/refunded,
  // and reprocessing would double-credit or double-refund the ledger.
  if (order.status !== "PENDING") {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  // payment_result.response_status: "A" = Authorized/success, "D" = Declined, "E" = Error, "H" = Hold.
  const status = body.payment_result?.response_status;
  const isPaid = status === "A";

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: isPaid ? "PAID" : "FAILED",
        paidAt: isPaid ? new Date() : null,
        paytabsTranRef: body.tran_ref ?? order.paytabsTranRef,
      },
    });

    if (!order.userId) return; // guest order — no account to credit/refund

    if (isPaid) {
      const earned = pointsEarnedForPaidCents(order.totalCents);
      if (earned > 0) {
        await tx.user.update({ where: { id: order.userId }, data: { loyaltyPoints: { increment: earned } } });
        await tx.loyaltyTransaction.create({
          data: { userId: order.userId, type: "EARN", points: earned, orderId: order.id },
        });
      }
    } else if (order.pointsRedeemed > 0) {
      await tx.user.update({ where: { id: order.userId }, data: { loyaltyPoints: { increment: order.pointsRedeemed } } });
      await tx.loyaltyTransaction.create({
        data: { userId: order.userId, type: "REFUND", points: order.pointsRedeemed, orderId: order.id },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
