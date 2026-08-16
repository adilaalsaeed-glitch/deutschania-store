import { NextResponse } from "next/server";
import JSZip from "jszip";
import { auth } from "@/lib/auth";
import { getInvoicesForPeriod } from "@/lib/accountingExport";
import { periodQuerySchema, periodLabel } from "@/lib/accountingPeriod";

export async function GET(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const url = new URL(request.url);
  const parsed = periodQuerySchema.safeParse({
    year: url.searchParams.get("year"),
    type: url.searchParams.get("type"),
    value: url.searchParams.get("value"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { year, type, value } = parsed.data;
  const invoices = await getInvoicesForPeriod(year, type, value);

  const zip = new JSZip();
  await Promise.all(
    invoices.flatMap((inv) => {
      const tasks: Promise<void>[] = [];
      if (inv.pdfUrlAr) {
        tasks.push(
          fetch(inv.pdfUrlAr)
            .then((r) => r.arrayBuffer())
            .then((buf) => {
              zip.file(`${inv.invoiceNumber}-ar.pdf`, buf);
            })
        );
      }
      if (inv.pdfUrlDe) {
        tasks.push(
          fetch(inv.pdfUrlDe)
            .then((r) => r.arrayBuffer())
            .then((buf) => {
              zip.file(`${inv.invoiceNumber}-de.pdf`, buf);
            })
        );
      }
      return tasks;
    })
  );

  const buffer = await zip.generateAsync({ type: "uint8array" });

  // TS's DOM lib types Uint8Array's backing buffer as ArrayBufferLike (which includes
  // SharedArrayBuffer), which BlobPart/BodyInit don't structurally accept - the bytes themselves
  // are a perfectly normal ArrayBuffer at runtime, this is purely a type-level mismatch.
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="rechnungen-${periodLabel(year, type, value)}.zip"`,
    },
  });
}
