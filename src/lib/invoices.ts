import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { htmlToPdf } from "@/lib/pdf";
import { formatPriceCents } from "@/lib/currency";
import { isKleinunternehmerEnabled, getStandardTaxRatePercent } from "@/lib/settings";
import { SELLER_INFO } from "@/lib/sellerInfo";
import type { Locale } from "@/i18n/config";

// Only ar/de PDFs are ever generated (see generateAndStorePdfs) - "en" was never actually
// rendered anywhere, so line items only need to carry what's really used.
type LineItem = {
  description: Record<"ar" | "de", string>;
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
    stornoTitle: "فاتورة تصحيحية",
    stornoBadge: "إشعار دائن",
    correctsLabel: "تصحيح للفاتورة رقم",
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
    stornoTitle: "Korrekturrechnung",
    stornoBadge: "Gutschrift",
    correctsLabel: "Korrektur zu Rechnung Nr.",
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

// Storno amounts are stored negative (a true reversal, not just a display flip) - format with a
// leading "-" instead of relying on toFixed's own minus sign landing after the currency symbol.
function formatMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}${formatPriceCents(Math.abs(cents), "EUR")}`;
}

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
    isStorno?: boolean;
    correctsInvoiceNumber?: string;
  }
): string {
  const t = copy[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";
  const dateFmt = (d: Date) => d.toLocaleDateString(locale === "ar" ? "ar-EG" : "de-DE");

  const rows = data.lineItems
    .map(
      (item, i) => `
      <tr class="${i % 2 === 1 ? "alt" : ""}">
        <td>${item.description[locale]}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${formatMoney(item.unitPriceCents)}</td>
        <td class="num">${formatMoney(item.lineTotalCents)}</td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html dir="${dir}" lang="${locale}">
<head>
<meta charset="utf-8" />
<style>
  :root {
    --ink: #5C7A5E;
    --sand: #EEECE5;
    --brass: #FCEAAE;
    --dark-text: #1A1D1E;
    --bad: #B54B3E;
    --line-dark: rgba(26, 29, 30, 0.14);
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Arial', 'Tahoma', sans-serif;
    color: var(--dark-text);
    margin: 0;
    padding: 0;
    direction: ${dir};
    font-size: 13px;
    line-height: 1.55;
  }

  .invoice-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 20px;
    margin-bottom: 26px;
    border-bottom: 3px solid var(--ink);
  }
  .brand-name { font-size: 1.5rem; font-weight: 700; color: var(--ink); letter-spacing: 0.2px; }
  .brand-meta { margin-top: 6px; font-size: 0.78rem; color: #555; line-height: 1.7; }

  .doc-meta { text-align: end; }
  .storno-badge {
    display: inline-block;
    background: var(--bad);
    color: #fff;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 3px;
    margin-bottom: 8px;
  }
  .doc-title { font-size: 1.35rem; font-weight: 700; margin: 0 0 10px; color: ${data.isStorno ? "var(--bad)" : "var(--dark-text)"}; }
  .doc-meta-row { font-size: 0.82rem; color: #444; margin-bottom: 3px; }
  .doc-meta-row strong { color: var(--dark-text); }

  .parties { display: flex; gap: 24px; margin-bottom: 28px; }
  .party-box { flex: 1; background: var(--sand); border-radius: 6px; padding: 16px 18px; }
  .party-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: var(--ink); margin-bottom: 8px; }
  .party-name { font-weight: 700; font-size: 0.95rem; margin-bottom: 4px; }
  .party-detail { font-size: 0.82rem; color: #444; line-height: 1.7; }

  table.items { width: 100%; border-collapse: collapse; margin-bottom: 22px; }
  table.items thead th {
    background: var(--ink);
    color: #fff;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    padding: 10px 12px;
    text-align: start;
  }
  table.items thead th.num { text-align: end; }
  table.items thead th:first-child { border-start-start-radius: 5px; border-end-start-radius: 5px; }
  table.items thead th:last-child { border-start-end-radius: 5px; border-end-end-radius: 5px; }
  table.items tbody td { padding: 10px 12px; font-size: 0.85rem; border-bottom: 1px solid var(--line-dark); }
  table.items tbody td.num { text-align: end; font-variant-numeric: tabular-nums; }
  table.items tbody tr.alt { background: rgba(238, 236, 229, 0.5); }

  .totals-block { width: 300px; margin-inline-start: auto; }
  .totals-row { display: flex; justify-content: space-between; padding: 5px 6px; font-size: 0.85rem; color: #444; }
  .totals-row.grand {
    background: var(--brass);
    border-radius: 6px;
    padding: 12px 14px;
    margin-top: 8px;
    font-size: 1.08rem;
    font-weight: 700;
    color: var(--dark-text);
  }

  .note-box {
    margin-top: 26px;
    padding: 12px 16px;
    background: var(--sand);
    border-inline-start: 3px solid var(--ink);
    border-radius: 4px;
    font-size: 0.75rem;
    color: #555;
    line-height: 1.7;
  }

  .footer {
    margin-top: 40px;
    padding-top: 14px;
    border-top: 1px solid var(--line-dark);
    font-size: 0.7rem;
    color: #999;
    text-align: center;
  }
</style>
</head>
<body>
  <div class="invoice-header">
    <div>
      <div class="brand-name">${SELLER_INFO.name}</div>
      <div class="brand-meta">${SELLER_INFO.address}<br />${SELLER_INFO.email}</div>
    </div>
    <div class="doc-meta">
      ${data.isStorno ? `<div class="storno-badge">${t.stornoBadge}</div>` : ""}
      <div class="doc-title">${data.isStorno ? t.stornoTitle : t.title}</div>
      <div class="doc-meta-row">${t.invoiceNumber}: <strong>${data.invoiceNumber}</strong></div>
      <div class="doc-meta-row">${t.issuedAt}: ${dateFmt(data.issuedAt)}</div>
      <div class="doc-meta-row">${t.deliveryDate}: ${dateFmt(data.deliveryDate)}</div>
      ${data.isStorno && data.correctsInvoiceNumber ? `<div class="doc-meta-row">${t.correctsLabel}: <strong>${data.correctsInvoiceNumber}</strong></div>` : ""}
    </div>
  </div>

  <div class="parties">
    <div class="party-box">
      <div class="party-label">${t.seller}</div>
      <div class="party-name">${SELLER_INFO.name}</div>
      <div class="party-detail">${SELLER_INFO.address}${SELLER_INFO.taxId ? `<br />${SELLER_INFO.taxId}` : ""}</div>
    </div>
    <div class="party-box">
      <div class="party-label">${t.buyer}</div>
      <div class="party-name">${data.buyerName}</div>
      <div class="party-detail">${data.buyerAddress}</div>
    </div>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th>${t.description}</th>
        <th class="num">${t.quantity}</th>
        <th class="num">${t.unitPrice}</th>
        <th class="num">${t.lineTotal}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals-block">
    <div class="totals-row"><span>${t.subtotal}</span><span>${formatMoney(data.subtotalCents)}</span></div>
    <div class="totals-row"><span>${t.tax} (${data.taxRatePercent}%)</span><span>${formatMoney(data.taxCents)}</span></div>
    <div class="totals-row grand"><span>${t.total}</span><span>${formatMoney(data.totalCents)}</span></div>
  </div>

  ${data.kleinunternehmerNote ? `<div class="note-box">${t.kleinunternehmer}</div>` : ""}

  <div class="footer">${SELLER_INFO.name} · ${SELLER_INFO.email}</div>
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

// Used only by AUTO invoices (createInvoiceForOrder below) - deliberately independent of
// Product.domesticTaxRatePercent, which is a reference-only field for a future domestic-sales
// feature and is never read here. The storefront currently ships only to SA/AE/QA (export), so
// every AUTO invoice stays 0% under the Kleinunternehmer/export rules regardless of what any
// product's domestic rate says - that field only feeds MANUAL invoice line items, which an admin
// explicitly creates for an off-platform (potentially domestic) sale.
async function buildTaxContext() {
  const [kleinunternehmer, standardRate] = await Promise.all([isKleinunternehmerEnabled(), getStandardTaxRatePercent()]);
  const taxRatePercent = kleinunternehmer ? 0 : standardRate;
  return { taxRatePercent, kleinunternehmerNote: kleinunternehmer };
}

// Picks the right-language product name for one invoice line, with a defensive fallback chain -
// a product missing a translation (e.g. German never filled in) shouldn't render a blank cell.
function pickLocalizedName(nameSnapshot: unknown, locale: "ar" | "de"): string {
  const record = nameSnapshot as Partial<Record<Locale, string>> | null | undefined;
  return record?.[locale] || record?.de || record?.ar || record?.en || "";
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

  // Each line item's product name is snapshotted here from the order's own nameSnapshot (itself
  // a snapshot of the real Product.name i18n record taken at checkout) - resolved per-language
  // right here, so the AR/DE PDFs each get their own correct translation rather than one
  // language's text leaking into the other.
  const lineItems: LineItem[] = order.items.map((item) => ({
    description: {
      ar: pickLocalizedName(item.nameSnapshot, "ar"),
      de: pickLocalizedName(item.nameSnapshot, "de"),
    },
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
  street: string;
  postalCode: string;
  city: string;
  country: string;
  deliveryDate: Date;
  createdByUserId: string;
  taxRatePercent: number; // admin's explicit choice at creation time - 19 / 7 / 0
  kleinunternehmerNote: boolean; // independent of the rate - only true when 0% is specifically the §19 UStG exemption, not e.g. an export sale
  lineItems: { descriptionAr: string; descriptionDe: string; quantity: number; unitPriceCents: number }[];
};

export async function createManualInvoice(input: ManualInvoiceInput) {
  const lineItems: LineItem[] = input.lineItems.map((item) => ({
    description: { ar: item.descriptionAr, de: item.descriptionDe },
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    lineTotalCents: item.unitPriceCents * item.quantity,
  }));
  const grossCents = lineItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const { netCents, taxCents } = computeTaxBreakdown(grossCents, input.taxRatePercent);

  const { year, sequence, invoiceNumber } = await getNextInvoiceNumber();
  const issuedAt = new Date();
  // Same composition pattern as the AUTO path's shippingAddress -> buyerAddress above, for a
  // consistent look between AUTO and MANUAL invoices despite the different input shape.
  const buyerAddress = `${input.street}, ${input.city} ${input.postalCode}, ${input.country}`;

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
      buyerAddress,
      sellerSnapshot: SELLER_INFO,
      lineItems,
      subtotalCents: netCents,
      taxRatePercent: input.taxRatePercent,
      taxCents,
      totalCents: grossCents,
      kleinunternehmerNote: input.kleinunternehmerNote,
    },
  });

  await generateAndStorePdfs(invoice.id, invoiceNumber, {
    invoiceNumber,
    issuedAt,
    deliveryDate: input.deliveryDate,
    buyerName: input.buyerName,
    buyerAddress,
    lineItems,
    subtotalCents: netCents,
    taxRatePercent: input.taxRatePercent,
    taxCents,
    totalCents: grossCents,
    kleinunternehmerNote: input.kleinunternehmerNote,
  });

  return invoice;
}

// Issues a credit note (Storno/Gutschrift) reversing an original AUTO/MANUAL invoice after an
// approved return - draws the next number from the SAME counter used by every other invoice
// (never renumbers or touches the original row) and mirrors its line items with every monetary
// field negated. Idempotent per original invoice via the correctsInvoiceId unique constraint,
// same shape as createInvoiceForOrder's own idempotency check.
export async function createStornoInvoice(originalInvoiceId: string) {
  const existing = await prisma.invoice.findUnique({ where: { correctsInvoiceId: originalInvoiceId } });
  if (existing) return existing;

  const original = await prisma.invoice.findUniqueOrThrow({ where: { id: originalInvoiceId } });

  const lineItems: LineItem[] = (original.lineItems as unknown as LineItem[]).map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPriceCents: -item.unitPriceCents,
    lineTotalCents: -item.lineTotalCents,
  }));

  const { year, sequence, invoiceNumber } = await getNextInvoiceNumber();
  const issuedAt = new Date();

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      year,
      sequence,
      source: "STORNO",
      correctsInvoiceId: original.id,
      issuedAt,
      deliveryDate: original.deliveryDate,
      buyerName: original.buyerName,
      buyerAddress: original.buyerAddress,
      sellerSnapshot: original.sellerSnapshot as object,
      lineItems,
      subtotalCents: -original.subtotalCents,
      taxRatePercent: original.taxRatePercent,
      taxCents: -original.taxCents,
      totalCents: -original.totalCents,
      kleinunternehmerNote: original.kleinunternehmerNote,
    },
  });

  await generateAndStorePdfs(invoice.id, invoiceNumber, {
    invoiceNumber,
    issuedAt,
    deliveryDate: original.deliveryDate,
    buyerName: original.buyerName,
    buyerAddress: original.buyerAddress,
    lineItems,
    subtotalCents: -original.subtotalCents,
    taxRatePercent: original.taxRatePercent,
    taxCents: -original.taxCents,
    totalCents: -original.totalCents,
    kleinunternehmerNote: original.kleinunternehmerNote,
    isStorno: true,
    correctsInvoiceNumber: original.invoiceNumber,
  });

  return invoice;
}
