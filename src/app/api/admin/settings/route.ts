import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isReferralsEnabled, setReferralsEnabled } from "@/lib/settings";

const updateSchema = z.object({
  referralsEnabled: z.boolean(),
});

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  return NextResponse.json({ referralsEnabled: await isReferralsEnabled() });
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

  await setReferralsEnabled(parsed.data.referralsEnabled);
  return NextResponse.json({ referralsEnabled: parsed.data.referralsEnabled });
}
