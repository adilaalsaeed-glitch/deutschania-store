import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCartWithProducts } from "@/lib/cart";
import { createHostedPaymentPage } from "@/lib/paytabs";
import { validateRedemption } from "@/lib/loyalty";
import { SUPPORTED_COUNTRIES, type CountryCode } from "@/data/countries";

const countryCodes = SUPPORTED_COUNTRIES.map((c) => c.code) as [CountryCode, ...CountryCode[]];

const checkoutSchema = z.object({
  fullName: z.string().min(1).max(120),
  email: z.email(),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  postal: z.string().min(1).max(20),
  country: z.enum(countryCodes),
  phone: z.string().min(1).max(30),
  lang: z.enum(["ar", "de", "en"]).default("en"),
  pointsToRedeem: z.number().int().nonnegative().optional().default(0),
});

function generateOrderNumber() {
  return `DTS-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    const countryIssue = parsed.error.issues.some((i) => i.path.includes("country"));
    return NextResponse.json({ error: countryIssue ? "COUNTRY_NOT_SUPPORTED" : "VALIDATION_ERROR" }, { status: 400 });
  }

  const { identity, items } = await getCartWithProducts();
  if (items.length === 0) {
    return NextResponse.json({ error: "CART_EMPTY" }, { status: 400 });
  }

  const subtotalCents = items.reduce((sum, i) => sum + i.product.priceCents * i.quantity, 0);
  const orderNumber = generateOrderNumber();
  const data = parsed.data;
  const pointsToRedeem = data.pointsToRedeem;

  if (pointsToRedeem > 0) {
    if (!identity.userId) {
      return NextResponse.json({ error: "POINTS_LOGIN_REQUIRED" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: identity.userId }, select: { loyaltyPoints: true } });
    const validationError = validateRedemption(pointsToRedeem, subtotalCents, user?.loyaltyPoints ?? 0);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
  }

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      // Hold-and-refund: points are deducted here, atomically guarded by the WHERE clause so a
      // concurrent redemption can't double-spend the same balance. Refunded later if payment
      // never completes (see the catch block below and the PayTabs webhook).
      if (pointsToRedeem > 0 && identity.userId) {
        const held = await tx.user.updateMany({
          where: { id: identity.userId, loyaltyPoints: { gte: pointsToRedeem } },
          data: { loyaltyPoints: { decrement: pointsToRedeem } },
        });
        if (held.count !== 1) {
          throw new Error("POINTS_INSUFFICIENT_BALANCE");
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: identity.userId,
          email: data.email,
          shippingAddress: {
            fullName: data.fullName,
            address: data.address,
            city: data.city,
            postal: data.postal,
            country: data.country,
            phone: data.phone,
          },
          subtotalCents,
          pointsRedeemed: pointsToRedeem,
          pointsDiscountCents: pointsToRedeem,
          totalCents: subtotalCents - pointsToRedeem,
          currency: "EUR",
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              nameSnapshot: i.product.name as object,
              priceCentsAtSale: i.product.priceCents,
              quantity: i.quantity,
            })),
          },
        },
      });

      if (pointsToRedeem > 0 && identity.userId) {
        await tx.loyaltyTransaction.create({
          data: { userId: identity.userId, type: "REDEEM", points: -pointsToRedeem, orderId: created.id },
        });
      }

      return created;
    });
  } catch (err) {
    if (err instanceof Error && err.message === "POINTS_INSUFFICIENT_BALANCE") {
      return NextResponse.json({ error: "POINTS_INSUFFICIENT_BALANCE" }, { status: 400 });
    }
    throw err;
  }

  // Cart is converted into the order now; a failed/abandoned payment leaves the order PENDING
  // rather than restoring the cart (kept simple for this scaffold).
  const cartWhere = identity.userId ? { userId: identity.userId } : { sessionId: identity.sessionId };
  await prisma.cartItem.deleteMany({ where: cartWhere });

  const origin = new URL(request.url).origin;

  try {
    const payment = await createHostedPaymentPage({
      cartId: order.orderNumber,
      cartDescription: `deutschania order ${order.orderNumber}`,
      amount: order.totalCents / 100,
      currency: "EUR",
      customerEmail: data.email,
      customerName: data.fullName,
      customerPhone: data.phone,
      returnUrl: `${origin}/checkout/return?order=${order.orderNumber}`,
      callbackUrl: `${origin}/api/paytabs/webhook`,
      lang: data.lang === "de" ? "en" : data.lang,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paytabsTranRef: payment.tran_ref },
    });

    return NextResponse.json({ redirectUrl: payment.redirect_url, orderNumber: order.orderNumber });
  } catch (err) {
    // No PayTabs credentials configured yet, or the request to PayTabs failed — surface a
    // translated code to the customer, and the real detail (server-side only) for debugging.
    console.error("PayTabs checkout failed:", err);

    // The order never reached PayTabs, so it will never receive a webhook callback that could
    // release the hold — refund any redeemed points right away instead of leaving them stuck.
    if (order.pointsRedeemed > 0 && identity.userId) {
      await prisma.$transaction([
        prisma.user.update({ where: { id: identity.userId }, data: { loyaltyPoints: { increment: order.pointsRedeemed } } }),
        prisma.loyaltyTransaction.create({
          data: { userId: identity.userId, type: "REFUND", points: order.pointsRedeemed, orderId: order.id },
        }),
      ]);
    }

    return NextResponse.json(
      {
        error: "PAYMENT_FAILED",
        detail: err instanceof Error ? err.message : String(err),
        orderNumber: order.orderNumber,
      },
      { status: 502 }
    );
  }
}
