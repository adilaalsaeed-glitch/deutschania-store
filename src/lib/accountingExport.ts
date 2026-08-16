import { prisma } from "@/lib/db";
import { computePeriodRange, type PeriodType } from "@/lib/accountingPeriod";

export async function getInvoicesForPeriod(year: number, type: PeriodType, value: number) {
  const { from, to } = computePeriodRange(year, type, value);
  return prisma.invoice.findMany({
    where: { issuedAt: { gte: from, lt: to } },
    orderBy: [{ year: "asc" }, { sequence: "asc" }],
  });
}

function csvEscape(field: string): string {
  return /[";\n]/.test(field) ? `"${field.replace(/"/g, '""')}"` : field;
}

// German accounting convention: comma as the decimal separator (matches the semicolon field
// delimiter below - both assume the file is opened by German-locale Excel/accounting software,
// which is the actual reader here, a Steuerberater).
function formatGermanDecimal(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}${(Math.abs(cents) / 100).toFixed(2).replace(".", ",")}`;
}

const TYPE_LABEL: Record<string, string> = { AUTO: "Rechnung", MANUAL: "Manuell", STORNO: "Gutschrift" };

type InvoiceRow = {
  invoiceNumber: string;
  issuedAt: Date;
  source: string;
  buyerName: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
};

const UTF8_BOM = "﻿";

// Semicolon-delimited (not comma) - the standard German Excel convention, since a comma is
// already the decimal separator there. UTF-8 BOM so Excel renders German/Arabic characters
// correctly instead of guessing the wrong codepage; CRLF line endings for the same reason.
export function buildAccountingCsv(invoices: InvoiceRow[]): string {
  const header = ["Rechnungsnummer", "Datum", "Typ", "Kunde", "Netto (EUR)", "MwSt (EUR)", "Brutto (EUR)"];
  const rows = invoices.map((inv) => [
    inv.invoiceNumber,
    inv.issuedAt.toLocaleDateString("de-DE"),
    TYPE_LABEL[inv.source] ?? inv.source,
    inv.buyerName,
    formatGermanDecimal(inv.subtotalCents),
    formatGermanDecimal(inv.taxCents),
    formatGermanDecimal(inv.totalCents),
  ]);
  const lines = [header, ...rows].map((cols) => cols.map(csvEscape).join(";"));
  return UTF8_BOM + lines.join("\r\n") + "\r\n";
}
