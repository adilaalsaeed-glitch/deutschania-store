import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/orderManagement";

const bodySchema = z.object({
  status: z.enum(["PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  trackingNumber: z.string().max(120).optional(),
  cancelReason: z.string().max(1000).optional(),
});

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/orders/[id]/status">) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { id } = await ctx.params;
  const origin = new URL(request.url).origin;

  const result = await updateOrderStatus(id, parsed.data.status, {
    trackingNumber: parsed.data.trackingNumber,
    cancelReason: parsed.data.cancelReason,
    adminUserId: session.user.id,
    orderUrl: `${origin}/account/orders`,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
