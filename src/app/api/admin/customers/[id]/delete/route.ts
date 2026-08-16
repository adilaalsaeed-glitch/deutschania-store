import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eraseCustomerData } from "@/lib/gdpr";

export async function POST(_request: Request, ctx: RouteContext<"/api/admin/customers/[id]/delete">) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await ctx.params;

  // Never let an admin erase their own account through this tool - it's built for handling a
  // customer's request, not account self-deletion, and would leave no admin left mid-request.
  if (id === session.user.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  await eraseCustomerData(id).catch((err) => {
    console.error(`Failed to erase customer ${id}:`, err);
    throw err;
  });

  return NextResponse.json({ ok: true });
}
