import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exportCustomerData } from "@/lib/gdpr";

export async function GET(_request: Request, ctx: RouteContext<"/api/admin/customers/[id]/export">) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const data = await exportCustomerData(id).catch(() => null);
  if (!data) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="customer-${id}-export.json"`,
    },
  });
}
