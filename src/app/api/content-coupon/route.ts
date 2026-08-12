import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isContentCouponEnabled } from "@/lib/settings";

const applySchema = z.object({
  profileUrl: z.url().max(500),
  videoUrl: z.url().max(500),
  consent: z.literal(true),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const enabled = await isContentCouponEnabled();
  if (!enabled) {
    return NextResponse.json({ enabled: false });
  }

  const userId = session.user.id;
  const [latestSubmission, coupons] = await Promise.all([
    prisma.contentSubmission.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.coupon.findMany({ where: { userId, source: "CONTENT" }, orderBy: { createdAt: "desc" } }),
  ]);

  const now = new Date();

  return NextResponse.json({
    enabled: true,
    submission: latestSubmission && {
      status: latestSubmission.status,
      profileUrl: latestSubmission.profileUrl,
      videoUrl: latestSubmission.videoUrl,
      createdAt: latestSubmission.createdAt,
    },
    coupons: coupons.map((c) => ({
      id: c.id,
      code: c.code,
      percentage: c.percentage,
      minOrderCents: c.minOrderCents,
      status: c.status === "ACTIVE" && c.expiresAt < now ? "EXPIRED" : c.status,
      expiresAt: c.expiresAt,
      createdAt: c.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!(await isContentCouponEnabled())) {
    return NextResponse.json({ error: "FEATURE_DISABLED" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const userId = session.user.id;
  const pending = await prisma.contentSubmission.findFirst({ where: { userId, status: "PENDING" } });
  if (pending) {
    return NextResponse.json({ error: "SUBMISSION_ALREADY_PENDING" }, { status: 409 });
  }

  const submission = await prisma.contentSubmission.create({
    data: {
      userId,
      profileUrl: parsed.data.profileUrl,
      videoUrl: parsed.data.videoUrl,
      consentAcceptedAt: new Date(),
    },
  });

  return NextResponse.json({ id: submission.id, status: submission.status }, { status: 201 });
}
