import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCartWithProducts, guestCookieName } from "@/lib/cart";

function withGuestCookie(res: NextResponse, identity: Awaited<ReturnType<typeof getCartWithProducts>>["identity"]) {
  if (identity.sessionId && identity.isNew) {
    res.cookies.set(guestCookieName(), identity.sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  return res;
}

export async function GET() {
  const { identity, items } = await getCartWithProducts();
  return withGuestCookie(NextResponse.json({ items }), identity);
}

const addSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99).default(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { identity, items } = await getCartWithProducts();
  const where = identity.userId ? { userId: identity.userId } : { sessionId: identity.sessionId };
  const existing = items.find((i) => i.productId === parsed.data.productId);

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + parsed.data.quantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { ...where, productId: parsed.data.productId, quantity: parsed.data.quantity },
    });
  }

  const result = await getCartWithProducts();
  return withGuestCookie(NextResponse.json({ items: result.items }), identity);
}

const setSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(0).max(99),
});

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = setSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { identity, items } = await getCartWithProducts();
  const existing = items.find((i) => i.productId === parsed.data.productId);

  if (existing) {
    if (parsed.data.quantity === 0) {
      await prisma.cartItem.delete({ where: { id: existing.id } });
    } else {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: parsed.data.quantity } });
    }
  }

  const result = await getCartWithProducts();
  return withGuestCookie(NextResponse.json({ items: result.items }), identity);
}

const removeSchema = z.object({ productId: z.string().min(1) });

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = removeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { identity, items } = await getCartWithProducts();
  const existing = items.find((i) => i.productId === parsed.data.productId);
  if (existing) {
    await prisma.cartItem.delete({ where: { id: existing.id } });
  }

  const result = await getCartWithProducts();
  return withGuestCookie(NextResponse.json({ items: result.items }), identity);
}
