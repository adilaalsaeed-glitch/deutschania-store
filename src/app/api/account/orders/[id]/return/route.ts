import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requestReturn } from "@/lib/returns";

const bodySchema = z.object({
  reason: z.string().trim().min(1).max(1000),
});

export async function POST(request: Request, ctx: RouteContext<"/api/account/orders/[id]/return">) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { id } = await ctx.params;
  const result = await requestReturn(id, session.user.id, parsed.data.reason);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
