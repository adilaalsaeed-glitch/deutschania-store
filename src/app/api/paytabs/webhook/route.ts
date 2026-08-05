import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PayTabs calls this server-to-server once a payment finishes (independent of whether the
// customer's browser makes it back to the return URL). See:
// https://docs.paytabs.com/manuals/PT-API-Endpoints/Integration-Types-Manuals/Hosted-Payment-Page/
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.cart_id) {
    return NextResponse.json({ error: "Missing cart_id" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { orderNumber: body.cart_id } });
  if (!order) {
    return NextResponse.json({ error: "Unknown order" }, { status: 404 });
  }

  // payment_result.response_status: "A" = Authorized/success, "D" = Declined, "E" = Error, "H" = Hold.
  const status = body.payment_result?.response_status;
  const isPaid = status === "A";

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: isPaid ? "PAID" : "FAILED",
      paidAt: isPaid ? new Date() : null,
      paytabsTranRef: body.tran_ref ?? order.paytabsTranRef,
    },
  });

  return NextResponse.json({ ok: true });
}
