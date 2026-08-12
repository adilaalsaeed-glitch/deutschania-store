import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  isReferralsEnabled,
  setReferralsEnabled,
  isContentCouponEnabled,
  setContentCouponEnabled,
  getContentCouponTerms,
  setContentCouponTerms,
} from "@/lib/settings";

const updateSchema = z.object({
  referralsEnabled: z.boolean().optional(),
  contentCouponEnabled: z.boolean().optional(),
  contentCouponPercentage: z.number().int().min(1).max(100).optional(),
  contentCouponMinOrderCents: z.number().int().min(0).optional(),
});

async function currentSettings() {
  const [referralsEnabled, contentCouponEnabled, terms] = await Promise.all([
    isReferralsEnabled(),
    isContentCouponEnabled(),
    getContentCouponTerms(),
  ]);
  return {
    referralsEnabled,
    contentCouponEnabled,
    contentCouponPercentage: terms.percentage,
    contentCouponMinOrderCents: terms.minOrderCents,
  };
}

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  return NextResponse.json(await currentSettings());
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const data = parsed.data;
  if (data.referralsEnabled !== undefined) {
    await setReferralsEnabled(data.referralsEnabled);
  }
  if (data.contentCouponEnabled !== undefined) {
    await setContentCouponEnabled(data.contentCouponEnabled);
  }
  if (data.contentCouponPercentage !== undefined || data.contentCouponMinOrderCents !== undefined) {
    const current = await getContentCouponTerms();
    await setContentCouponTerms({
      percentage: data.contentCouponPercentage ?? current.percentage,
      minOrderCents: data.contentCouponMinOrderCents ?? current.minOrderCents,
    });
  }

  return NextResponse.json(await currentSettings());
}
