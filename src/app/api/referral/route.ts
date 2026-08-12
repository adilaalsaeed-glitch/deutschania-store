import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isReferralsEnabled } from "@/lib/settings";
import { referralUrl, siteOrigin } from "@/lib/referral";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const enabled = await isReferralsEnabled();
  if (!enabled) {
    return NextResponse.json({ enabled: false });
  }

  const userId = session.user.id;
  const origin = siteOrigin();

  const [successfulCount, coupons] = await Promise.all([
    prisma.referral.count({ where: { referrerId: userId, status: "COMPLETED" } }),
    prisma.coupon.findMany({
      where: { userId, source: "REFERRAL" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const now = new Date();

  return NextResponse.json({
    enabled: true,
    referralUrl: referralUrl(origin, userId),
    successfulCount,
    coupons: coupons.map((c) => ({
      id: c.id,
      code: c.code,
      valueCents: c.valueCents,
      status: c.status === "ACTIVE" && c.expiresAt < now ? "EXPIRED" : c.status,
      expiresAt: c.expiresAt,
      createdAt: c.createdAt,
    })),
  });
}
