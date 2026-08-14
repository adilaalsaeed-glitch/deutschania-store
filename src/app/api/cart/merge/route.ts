import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { guestCookieName } from "@/lib/cart";

// resolveCartIdentity() checks the session first and, once logged in, never looks at the guest
// cart cookie again - so without this step, anything added before login is silently orphaned
// under the old sessionId forever (the exact "header shows items, checkout shows empty" bug).
// Called once right after a successful sign-in (see login/page.tsx).
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const jar = await cookies();
  const guestId = jar.get(guestCookieName())?.value;
  if (!guestId) {
    return NextResponse.json({ merged: 0 });
  }

  const guestItems = await prisma.cartItem.findMany({ where: { sessionId: guestId } });
  if (guestItems.length === 0) {
    const res = NextResponse.json({ merged: 0 });
    res.cookies.delete(guestCookieName());
    return res;
  }

  const userItems = await prisma.cartItem.findMany({ where: { userId: session.user.id } });
  const userItemByProduct = new Map(userItems.map((i) => [i.productId, i]));

  await prisma.$transaction(async (tx) => {
    for (const guestItem of guestItems) {
      const existing = userItemByProduct.get(guestItem.productId);
      if (existing) {
        // Same product in both carts - combine quantities into the account's row, drop the
        // guest row (final stock ceiling is still enforced by the cart page and at checkout).
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + guestItem.quantity },
        });
        await tx.cartItem.delete({ where: { id: guestItem.id } });
      } else {
        await tx.cartItem.update({
          where: { id: guestItem.id },
          data: { userId: session.user.id, sessionId: null },
        });
      }
    }
  });

  const res = NextResponse.json({ merged: guestItems.length });
  res.cookies.delete(guestCookieName());
  return res;
}
