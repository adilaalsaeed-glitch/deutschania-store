import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCartWithProducts } from "@/lib/cart";
import { createHostedPaymentPage } from "@/lib/paytabs";

const checkoutSchema = z.object({
  fullName: z.string().min(1).max(120),
  email: z.email(),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  postal: z.string().min(1).max(20),
  country: z.string().min(1).max(100),
  phone: z.string().min(1).max(30),
  lang: z.enum(["ar", "de", "en"]).default("en"),
});

function generateOrderNumber() {
  return `DTS-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { identity, items } = await getCartWithProducts();
  if (items.length === 0) {
    return NextResponse.json({ error: "CART_EMPTY" }, { status: 400 });
  }

  const subtotalCents = items.reduce((sum, i) => sum + i.product.priceCents * i.quantity, 0);
  const orderNumber = generateOrderNumber();
  const data = parsed.data;

  const order = await prisma.order.create({
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
      totalCents: subtotalCents,
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

  // Cart is converted into the order now; a failed/abandoned payment leaves the order PENDING
  // rather than restoring the cart (kept simple for this scaffold).
  const cartWhere = identity.userId ? { userId: identity.userId } : { sessionId: identity.sessionId };
  await prisma.cartItem.deleteMany({ where: cartWhere });

  const origin = new URL(request.url).origin;

  try {
    const payment = await createHostedPaymentPage({
      cartId: order.orderNumber,
      cartDescription: `deutschania order ${order.orderNumber}`,
      amount: subtotalCents / 100,
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
