import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getContentCouponTerms } from "@/lib/settings";
import { couponExpiryDate, generateCouponCode } from "@/lib/coupons";

const decisionSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/content-submissions/[id]">) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const submission = await prisma.contentSubmission.findUnique({ where: { id } });
  if (!submission) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (submission.status !== "PENDING") {
    return NextResponse.json({ error: "ALREADY_REVIEWED" }, { status: 409 });
  }

  const adminId = session.user.id;

  if (parsed.data.action === "reject") {
    await prisma.contentSubmission.update({
      where: { id },
      data: { status: "REJECTED", reviewedBy: adminId, reviewedAt: new Date() },
    });
    return NextResponse.json({ status: "REJECTED" });
  }

  const { percentage, minOrderCents } = await getContentCouponTerms();

  await prisma.$transaction(async (tx) => {
    const coupon = await tx.coupon.create({
      data: {
        code: generateCouponCode("CNT"),
        userId: submission.userId,
        discountType: "PERCENTAGE",
        percentage,
        minOrderCents,
        source: "CONTENT",
        expiresAt: couponExpiryDate(),
      },
    });
    await tx.contentSubmission.update({
      where: { id },
      data: { status: "APPROVED", reviewedBy: adminId, reviewedAt: new Date(), couponId: coupon.id },
    });
  });

  return NextResponse.json({ status: "APPROVED" });
}
