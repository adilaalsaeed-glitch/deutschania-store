import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Invoice PDFs live in Vercel Blob under an unguessable path, but that alone isn't real access
// control for a document containing another person's name/address - this route is the actual
// gate: only the order's owner (or an admin) may resolve an invoice id to its file.
export async function GET(request: Request, ctx: RouteContext<"/api/account/invoices/[id]/download">) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const url = new URL(request.url);
  const lang = url.searchParams.get("lang") === "de" ? "de" : "ar";

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { pdfUrlAr: true, pdfUrlDe: true, order: { select: { userId: true } } },
  });

  if (!invoice) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const isOwner = invoice.order?.userId === session.user.id;
  if (!isOwner && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const target = lang === "de" ? invoice.pdfUrlDe : invoice.pdfUrlAr;
  if (!target) {
    return NextResponse.json({ error: "NOT_READY" }, { status: 404 });
  }

  return NextResponse.redirect(target);
}
