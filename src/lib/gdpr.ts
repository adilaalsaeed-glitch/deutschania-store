import { prisma } from "@/lib/db";

// Full data export for a "subject access request" - everything this account's data touches,
// gathered in one place rather than the customer having to ask for each piece separately.
export async function exportCustomerData(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      dateOfBirth: true,
      role: true,
      emailVerified: true,
      loyaltyPoints: true,
      createdAt: true,
    },
  });

  const [addresses, orders, loyaltyTransactions, coupons, referralsMade, referredBy, contentSubmissions, wishlist, cartItems] =
    await Promise.all([
      prisma.address.findMany({ where: { userId } }),
      prisma.order.findMany({
        where: { userId },
        include: { items: true, invoice: { select: { invoiceNumber: true, issuedAt: true, totalCents: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.loyaltyTransaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.coupon.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.referral.findMany({ where: { referrerId: userId } }),
      prisma.referral.findUnique({ where: { referredId: userId } }),
      prisma.contentSubmission.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.wishlistItem.findMany({ where: { userId }, include: { product: { select: { slug: true, name: true } } } }),
      prisma.cartItem.findMany({ where: { userId }, include: { product: { select: { slug: true, name: true } } } }),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    profile: user,
    addresses,
    orders,
    loyaltyTransactions,
    coupons,
    referralsMade,
    referredBy,
    contentSubmissions,
    wishlist,
    cartItems,
  };
}

// "Right to be forgotten" (GDPR Art. 17) - but Art. 17(3)(b) exempts data kept under a legal
// retention obligation, and German tax law (§147 AO / §257 HGB) requires invoices to survive 10
// years. So this does NOT touch the Invoice table at all (name, address, line items stay as
// issued - correcting or deleting a legal document isn't erasure, it's falsification). Orders
// are the operational record behind those invoices, not the legal document itself, so their PII
// (the account link and shipping snapshot) is anonymized rather than the row being deleted -
// the order stays in place, matching its invoice's total for an audit, but is no longer
// attributable to a person. Everything else (addresses, cart, wishlist, tokens, loyalty ledger,
// coupons, referrals, content submissions) has no such retention requirement and is deleted
// outright via Prisma's existing onDelete: Cascade relations to User - see schema.prisma.
export async function eraseCustomerData(userId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.order.updateMany({
      where: { userId },
      data: {
        userId: null,
        email: "erased@deutschania.invalid",
        shippingAddress: { erased: true },
      },
    });
    await tx.user.delete({ where: { id: userId } });
  });
}
