import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { processReturn } from "@/lib/returns";

const bodySchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
});

export async function POST(request: Request, ctx: RouteContext<"/api/admin/orders/[id]/return">) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { id } = await ctx.params;
  const result = await processReturn(id, parsed.data.decision);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
