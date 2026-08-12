import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pointsEarnedForPaidCents } from "@/lib/loyalty";
import { isReferralsEnabled } from "@/lib/settings";
import { REFERRAL_COUPON_VALUE_CENTS } from "@/lib/referral";
import { couponExpiryDate, generateCouponCode } from "@/lib/coupons";

// PayTabs calls this server-to-server once a payment finishes (independent of whether the
// customer's browser makes it back to the return URL). See:
// https://docs.paytabs.com/manuals/PT-API-Endpoints/Integration-Types-Manuals/Hosted-Payment-Page/
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.cart_id) {
    return NextResponse.json({ error: "Missing cart_id" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: body.cart_id },
    include: { items: { select: { productId: true, quantity: true } } },
  });
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

  const referralsEnabled = isPaid && order.userId ? await isReferralsEnabled() : false;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: isPaid ? "PAID" : "FAILED",
        paidAt: isPaid ? new Date() : null,
        paytabsTranRef: body.tran_ref ?? order.paytabsTranRef,
      },
    });

    if (isPaid) {
      // Clamped at 0 via SQL (not a plain decrement) so a race between two paid orders for the
      // same product - or an order that already exceeded what was in stock - can't push it negative.
      // Runs for guest orders too (unlike the loyalty/referral logic below, which needs an account).
      for (const item of order.items) {
        if (!item.productId) continue;
        await tx.$executeRaw`UPDATE products SET "stockQuantity" = GREATEST("stockQuantity" - ${item.quantity}, 0) WHERE id = ${item.productId}`;
      }
    }

    if (!order.userId) return; // guest order — no account to credit/refund points to

    if (isPaid) {
      const earned = pointsEarnedForPaidCents(order.totalCents);
      if (earned > 0) {
        await tx.user.update({ where: { id: order.userId }, data: { loyaltyPoints: { increment: earned } } });
        await tx.loyaltyTransaction.create({
          data: { userId: order.userId, type: "EARN", points: earned, orderId: order.id },
        });
      }

      // Referral reward: this order is the referred user's first to reach PAID (the Referral
      // row only stays PENDING up to that point — see /api/register), so this is exactly the
      // "completed their first real order" condition. Gated so nothing is granted while the
      // feature flag is off, even if a PENDING referral exists from before it was disabled.
      if (referralsEnabled) {
        const referral = await tx.referral.findUnique({ where: { referredId: order.userId } });
        if (referral && referral.status === "PENDING") {
          await tx.referral.update({ where: { id: referral.id }, data: { status: "COMPLETED", completedAt: new Date() } });
          const expiresAt = couponExpiryDate();
          await tx.coupon.create({
            data: {
              code: generateCouponCode("REF"),
              userId: referral.referrerId,
              discountType: "FIXED",
              valueCents: REFERRAL_COUPON_VALUE_CENTS,
              source: "REFERRAL",
              expiresAt,
            },
          });
          await tx.coupon.create({
            data: {
              code: generateCouponCode("REF"),
              userId: referral.referredId,
              discountType: "FIXED",
              valueCents: REFERRAL_COUPON_VALUE_CENTS,
              source: "REFERRAL",
              expiresAt,
            },
          });
        }
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
