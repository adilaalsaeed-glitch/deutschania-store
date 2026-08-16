import { z } from "zod";

export type PeriodType = "month" | "quarter" | "year";

// Shared by both the CSV and ZIP export routes. value is only meaningful for month/quarter -
// clamped to a safe range regardless of type since the exact ceiling depends on it (validated
// again, precisely, wherever the type is known).
export const periodQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  type: z.enum(["month", "quarter", "year"]),
  value: z.coerce.number().int().min(1).max(12).default(1),
});

// value is a month number (1-12) when type is "month", a quarter number (1-4) when type is
// "quarter", and ignored when type is "year". Range is [from, to) - half-open, so filtering with
// issuedAt >= from && issuedAt < to needs no end-of-day fiddling.
export function computePeriodRange(year: number, type: PeriodType, value: number): { from: Date; to: Date } {
  if (type === "year") {
    return { from: new Date(Date.UTC(year, 0, 1)), to: new Date(Date.UTC(year + 1, 0, 1)) };
  }
  if (type === "quarter") {
    const startMonth = (value - 1) * 3;
    return { from: new Date(Date.UTC(year, startMonth, 1)), to: new Date(Date.UTC(year, startMonth + 3, 1)) };
  }
  return { from: new Date(Date.UTC(year, value - 1, 1)), to: new Date(Date.UTC(year, value, 1)) };
}

// A short, filename-safe label for the period, used in exported file names (e.g. "2026-Q1",
// "2026-03", "2026").
export function periodLabel(year: number, type: PeriodType, value: number): string {
  if (type === "year") return String(year);
  if (type === "quarter") return `${year}-Q${value}`;
  return `${year}-${String(value).padStart(2, "0")}`;
}
