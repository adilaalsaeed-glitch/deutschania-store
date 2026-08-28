import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { isSourceCountry } from "@/data/sourceCountries";

const i18nText = z.object({ ar: z.string(), de: z.string(), en: z.string() });
const attributeRow = z.object({ label: z.string().min(1), value: z.string().min(1) });
const attributesByLocale = z.object({
  ar: z.array(attributeRow),
  de: z.array(attributeRow),
  en: z.array(attributeRow),
});

export const productSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  brand: z.string().min(1).max(100),
  name: z.object({ ar: z.string().min(1), de: z.string().min(1), en: z.string().min(1) }),
  description: i18nText.optional(),
  priceCents: z.number().int().min(0).max(100_000_000),
  imageUrl: z.url().nullable().optional(),
  sourceCountry: z.string().refine(isSourceCountry, "Invalid source country"),
  categoryKey: z.string().min(1),
  featured: z.boolean().default(false),
  stockQuantity: z.number().int().min(0).max(1_000_000).default(0),
  attributes: attributesByLocale.optional(),
  domesticTaxRatePercent: z.union([z.literal(19), z.literal(7)]).nullable().default(null),
});

export type ProductInput = z.infer<typeof productSchema>;

function isEmptyI18n(v: { ar: string; de: string; en: string } | undefined): boolean {
  return !v || (!v.ar.trim() && !v.de.trim() && !v.en.trim());
}

function isEmptyAttributes(v: ProductInput["attributes"]): boolean {
  return !v || (v.ar.length === 0 && v.de.length === 0 && v.en.length === 0);
}

// Null out fields the admin left entirely blank, rather than storing empty JSON shells.
export function normalizeProductInput(data: ProductInput) {
  return {
    slug: data.slug,
    brand: data.brand,
    name: data.name,
    description: isEmptyI18n(data.description) ? Prisma.JsonNull : data.description,
    priceCents: data.priceCents,
    imageUrl: data.imageUrl || null,
    sourceCountry: data.sourceCountry,
    categoryKey: data.categoryKey,
    featured: data.featured,
    stockQuantity: data.stockQuantity,
    attributes: isEmptyAttributes(data.attributes) ? Prisma.JsonNull : data.attributes,
    domesticTaxRatePercent: data.domesticTaxRatePercent,
  };
}
