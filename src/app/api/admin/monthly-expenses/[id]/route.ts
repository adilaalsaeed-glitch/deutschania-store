import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/monthly-expenses/[id]">) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await ctx.params;
  await prisma.monthlyExpense.delete({ where: { id } }).catch(() => null);

  return NextResponse.json({ ok: true });
}
