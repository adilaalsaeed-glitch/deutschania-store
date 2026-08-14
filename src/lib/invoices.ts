import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { htmlToPdf } from "@/lib/pdf";
import { formatPriceCents } from "@/lib/currency";
import { isKleinunternehmerEnabled, getStandardTaxRatePercent } from "@/lib/settings";
import { SELLER_INFO } from "@/lib/sellerInfo";
import type { Locale } from "@/i18n/config";

type LineItem = {
  description: Record<Locale, string>;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

// Prices throughout the storefront are shown tax-inclusive (gross) - back out the net/tax
// split for the invoice rather than adding tax on top of an already-gross total.
function computeTaxBreakdown(grossCents: number, taxRatePercent: number) {
  const netCents = Math.round(grossCents / (1 + taxRatePercent / 100));
  const taxCents = grossCents - netCents;
  return { netCents, taxCents };
}

// Single counter shared by AUTO and MANUAL invoices - the INSERT...ON CONFLICT is one atomic
// statement, so concurrent callers can never receive the same number (Postgres serializes on
// the (year) primary key), and there's no window where a number is "reserved" but not yet
// backed by a real row the way a separate read-then-write would allow.
async function getNextInvoiceNumber(): Promise<{ year: number; sequence: number; invoiceNumber: string }> {
  const year = new Date().getFullYear();
  const rows = await prisma.$queryRaw<{ lastNumber: number }[]>`
    INSERT INTO invoice_counters (year, "lastNumber")
    VALUES (${year}, 1)
    ON CONFLICT (year) DO UPDATE SET "lastNumber" = invoice_counters."lastNumber" + 1
    RETURNING "lastNumber"
  `;
  const sequence = rows[0].lastNumber;
  return { year, sequence, invoiceNumber: `${year}-${String(sequence).padStart(4, "0")}` };
}

const copy = {
  ar: {
    title: "فاتورة",
    invoiceNumber: "رقم الفاتورة",
    issuedAt: "تاريخ الفاتورة",
    deliveryDate: "تاريخ التسليم",
    seller: "البائع",
    buyer: "المشتري",
    description: "الوصف",
    quantity: "الكمية",
    unitPrice: "سعر الوحدة",
    lineTotal: "الإجمالي",
    subtotal: "المجموع الفرعي (بدون ضريبة)",
    tax: "الضريبة",
    total: "الإجمالي الكلي",
    kleinunternehmer:
      "لا تُحتسب ضريبة القيمة المضافة وفقًا للفقرة 19 من قانون ضريبة المبيعات الألماني (Kleinunternehmerregelung nach §19 UStG).",
  },
  de: {
    title: "Rechnung",
    invoiceNumber: "Rechnungsnummer",
    issuedAt: "Rechnungsdatum",
    deliveryDate: "Lieferdatum",
    seller: "Verkäufer",
    buyer: "Käufer",
    description: "Beschreibung",
    quantity: "Menge",
    unitPrice: "Einzelpreis",
    lineTotal: "Gesamt",
    subtotal: "Zwischensumme (netto)",
    tax: "MwSt.",
    total: "Gesamtbetrag",
    kleinunternehmer: "Gemäß §19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).",
  },
} as const;

function renderInvoiceHtml(
  locale: "ar" | "de",
  data: {
    invoiceNumber: string;
    issuedAt: Date;
    deliveryDate: Date;
    buyerName: string;
    buyerAddress: string;
    lineItems: LineItem[];
    subtotalCents: number;
    taxRatePercent: number;
    taxCents: number;
    totalCents: number;
    kleinunternehmerNote: boolean;
  }
): string {
  const t = copy[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";
  const dateFmt = (d: Date) => d.toLocaleDateString(locale === "ar" ? "ar-EG" : "de-DE");

  const rows = data.lineItems
    .map(
      (item) => `
      <tr>
        <td>${item.description[locale]}</td>
        <td style="text-align:center;">${item.quantity}</td>
        <td style="text-align:end;">${formatPriceCents(item.unitPriceCents, "EUR")}</td>
        <td style="text-align:end;">${formatPriceCents(item.lineTotalCents, "EUR")}</td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html dir="${dir}" lang="${locale}">
<head>
<meta charset="utf-8" />
<style>
  body { font-family: 'Arial', 'Tahoma', sans-serif; color: #1A1D1E; padding: 0; margin: 0; direction: ${dir}; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
  .brand { font-size: 1.4rem; font-weight: 700; color: #5C7A5E; }
  h1 { font-size: 1.3rem; margin: 0 0 4px; }
  .meta { font-size: 0.85rem; color: #444; }
  .parties { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
  .party { flex: 1; font-size: 0.85rem; line-height: 1.6; }
  .party-label { font-weight: 700; font-size: 0.78rem; text-transform: uppercase; opacity: .6; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 18px; }
  th, td { border: 1px solid #ccc; padding: 8px 10px; }
  th { background: #F5F3EE; text-align: ${dir === "rtl" ? "right" : "left"}; }
  .totals { width: 280px; margin-inline-start: auto; font-size: 0.88rem; }
  .totals-row { display: flex; justify-content: space-between; padding: 4px 0; }
  .totals-row.grand { font-weight: 700; font-size: 1.05rem; border-top: 2px solid #1A1D1E; margin-top: 6px; padding-top: 8px; }
  .note { margin-top: 24px; font-size: 0.78rem; opacity: .75; line-height: 1.6; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">${SELLER_INFO.name}</div>
      <div class="meta">${SELLER_INFO.address}</div>
    </div>
    <div style="text-align:${dir === "rtl" ? "left" : "right"};">
      <h1>${t.title}</h1>
      <div class="meta">${t.invoiceNumber}: <strong>${data.invoiceNumber}</strong></div>
      <div class="meta">${t.issuedAt}: ${dateFmt(data.issuedAt)}</div>
      <div class="meta">${t.deliveryDate}: ${dateFmt(data.deliveryDate)}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-label">${t.seller}</div>
      ${SELLER_INFO.name}<br />
      ${SELLER_INFO.address}
      ${SELLER_INFO.taxId ? `<br />${SELLER_INFO.taxId}` : ""}
    </div>
    <div class="party">
      <div class="party-label">${t.buyer}</div>
      ${data.buyerName}<br />
      ${data.buyerAddress}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>${t.description}</th>
        <th style="text-align:center;">${t.quantity}</th>
        <th style="text-align:end;">${t.unitPrice}</th>
        <th style="text-align:end;">${t.lineTotal}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>${t.subtotal}</span><span>${formatPriceCents(data.subtotalCents, "EUR")}</span></div>
    <div class="totals-row"><span>${t.tax} (${data.taxRatePercent}%)</span><span>${formatPriceCents(data.taxCents, "EUR")}</span></div>
    <div class="totals-row grand"><span>${t.total}</span><span>${formatPriceCents(data.totalCents, "EUR")}</span></div>
  </div>

  ${data.kleinunternehmerNote ? `<div class="note">${t.kleinunternehmer}</div>` : ""}
</body>
</html>`;
}

async function generateAndStorePdfs(
  invoiceId: string,
  invoiceNumber: string,
  data: Parameters<typeof renderInvoiceHtml>[1]
) {
  const [pdfAr, pdfDe] = await Promise.all([
    htmlToPdf(renderInvoiceHtml("ar", data)),
    htmlToPdf(renderInvoiceHtml("de", data)),
  ]);

  const [blobAr, blobDe] = await Promise.all([
    put(`invoices/${invoiceNumber}-ar.pdf`, pdfAr, { access: "public", contentType: "application/pdf" }),
    put(`invoices/${invoiceNumber}-de.pdf`, pdfDe, { access: "public", contentType: "application/pdf" }),
  ]);

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { pdfUrlAr: blobAr.url, pdfUrlDe: blobDe.url },
  });
}

async function buildTaxContext() {
  const [kleinunternehmer, standardRate] = await Promise.all([isKleinunternehmerEnabled(), getStandardTaxRatePercent()]);
  const taxRatePercent = kleinunternehmer ? 0 : standardRate;
  return { taxRatePercent, kleinunternehmerNote: kleinunternehmer };
}

// Called from the PayTabs webhook right after an order reaches PAID. Idempotent: if a webhook
// fires twice for the same order (PayTabs' own documented behavior), the second call is a
// no-op rather than reserving a second number for the same sale.
export async function createInvoiceForOrder(orderId: string) {
  const existing = await prisma.invoice.findUnique({ where: { orderId } });
  if (existing) return existing;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new Error("Order not found for invoice generation");

  const { taxRatePercent, kleinunternehmerNote } = await buildTaxContext();
  const { netCents, taxCents } = computeTaxBreakdown(order.totalCents, taxRatePercent);

  const lineItems: LineItem[] = order.items.map((item) => ({
    description: item.nameSnapshot as Record<Locale, string>,
    quantity: item.quantity,
    unitPriceCents: item.priceCentsAtSale,
    lineTotalCents: item.priceCentsAtSale * item.quantity,
  }));

  const shipping = order.shippingAddress as { fullName: string; address: string; city: string; postal: string; country: string };
  const buyerAddress = `${shipping.address}, ${shipping.city} ${shipping.postal}, ${shipping.country}`;

  const { year, sequence, invoiceNumber } = await getNextInvoiceNumber();
  const issuedAt = order.paidAt ?? new Date();

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      year,
      sequence,
      source: "AUTO",
      orderId: order.id,
      issuedAt,
      deliveryDate: issuedAt, // no separate fulfillment tracking yet - order date stands in until that exists
      buyerName: shipping.fullName,
      buyerAddress,
      sellerSnapshot: SELLER_INFO,
      lineItems,
      subtotalCents: netCents,
      taxRatePercent,
      taxCents,
      totalCents: order.totalCents,
      kleinunternehmerNote,
    },
  });

  await generateAndStorePdfs(invoice.id, invoiceNumber, {
    invoiceNumber,
    issuedAt,
    deliveryDate: issuedAt,
    buyerName: shipping.fullName,
    buyerAddress,
    lineItems,
    subtotalCents: netCents,
    taxRatePercent,
    taxCents,
    totalCents: order.totalCents,
    kleinunternehmerNote,
  });

  return invoice;
}

export type ManualInvoiceInput = {
  buyerName: string;
  buyerAddress: string;
  deliveryDate: Date;
  createdByUserId: string;
  lineItems: { description: string; quantity: number; unitPriceCents: number }[];
};

export async function createManualInvoice(input: ManualInvoiceInput) {
  const { taxRatePercent, kleinunternehmerNote } = await buildTaxContext();

  const lineItems: LineItem[] = input.lineItems.map((item) => ({
    description: { ar: item.description, de: item.description, en: item.description },
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    lineTotalCents: item.unitPriceCents * item.quantity,
  }));
  const grossCents = lineItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const { netCents, taxCents } = computeTaxBreakdown(grossCents, taxRatePercent);

  const { year, sequence, invoiceNumber } = await getNextInvoiceNumber();
  const issuedAt = new Date();

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      year,
      sequence,
      source: "MANUAL",
      createdByUserId: input.createdByUserId,
      issuedAt,
      deliveryDate: input.deliveryDate,
      buyerName: input.buyerName,
      buyerAddress: input.buyerAddress,
      sellerSnapshot: SELLER_INFO,
      lineItems,
      subtotalCents: netCents,
      taxRatePercent,
      taxCents,
      totalCents: grossCents,
      kleinunternehmerNote,
    },
  });

  await generateAndStorePdfs(invoice.id, invoiceNumber, {
    invoiceNumber,
    issuedAt,
    deliveryDate: input.deliveryDate,
    buyerName: input.buyerName,
    buyerAddress: input.buyerAddress,
    lineItems,
    subtotalCents: netCents,
    taxRatePercent,
    taxCents,
    totalCents: grossCents,
    kleinunternehmerNote,
  });

  return invoice;
}
