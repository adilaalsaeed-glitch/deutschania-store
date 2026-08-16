import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  suspended: z.boolean(),
  reason: z.string().max(1000).optional(),
});

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/users/[id]/status">) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { id } = await ctx.params;
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  // This tool is for moderating customer accounts, not for admins to lock each other out.
  if (target.role !== "CUSTOMER") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id },
    data: parsed.data.suspended
      ? {
          suspended: true,
          suspendedAt: new Date(),
          suspendedReason: parsed.data.reason || null,
          suspendedByUserId: session.user.id,
        }
      : { suspended: false, suspendedAt: null, suspendedReason: null, suspendedByUserId: null },
  });

  return NextResponse.json({ ok: true });
}
