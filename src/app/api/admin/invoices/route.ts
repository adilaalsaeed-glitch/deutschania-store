import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createManualInvoice } from "@/lib/invoices";

const lineItemSchema = z.object({
  description: z.string().min(1).max(300),
  quantity: z.number().int().min(1).max(100_000),
  unitPriceCents: z.number().int().min(0).max(1_000_000_00),
});

const manualInvoiceSchema = z.object({
  buyerName: z.string().min(1).max(200),
  buyerAddress: z.string().min(1).max(400),
  deliveryDate: z.string().min(1), // ISO date string from a <input type="date">
  lineItems: z.array(lineItemSchema).min(1).max(50),
});

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = manualInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const invoice = await createManualInvoice({
    buyerName: parsed.data.buyerName,
    buyerAddress: parsed.data.buyerAddress,
    deliveryDate: new Date(parsed.data.deliveryDate),
    createdByUserId: session.user.id,
    lineItems: parsed.data.lineItems,
  });

  return NextResponse.json({ id: invoice.id, invoiceNumber: invoice.invoiceNumber }, { status: 201 });
}
