import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getInvoicesForPeriod, buildAccountingCsv } from "@/lib/accountingExport";
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
  const csv = buildAccountingCsv(invoices);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rechnungen-${periodLabel(year, type, value)}.csv"`,
    },
  });
}
