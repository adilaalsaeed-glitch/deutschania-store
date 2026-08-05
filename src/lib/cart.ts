import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const GUEST_COOKIE = "guest_cart_id";

// Resolves the current cart owner: a logged-in user's id, or a guest cookie id
// (creating the cookie if this is the visitor's first cart interaction).
export async function resolveCartIdentity(): Promise<
  { userId: string; sessionId?: undefined } | { userId?: undefined; sessionId: string; isNew: boolean }
> {
  const session = await auth();
  if (session?.user?.id) {
    return { userId: session.user.id };
  }

  const jar = await cookies();
  const existing = jar.get(GUEST_COOKIE)?.value;
  if (existing) {
    return { sessionId: existing, isNew: false };
  }
  return { sessionId: randomUUID(), isNew: true };
}

export function guestCookieName() {
  return GUEST_COOKIE;
}

export async function getCartWithProducts() {
  const identity = await resolveCartIdentity();
  const where = identity.userId ? { userId: identity.userId } : { sessionId: identity.sessionId };
  const items = await prisma.cartItem.findMany({
    where,
    include: { product: { include: { category: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return { identity, items };
}
