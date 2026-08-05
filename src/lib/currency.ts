export const currencies = {
  EUR: { symbol: "€", rate: 1 },
  AED: { symbol: "د.إ", rate: 3.95 },
  SAR: { symbol: "ر.س", rate: 4.05 },
  EGP: { symbol: "ج.م", rate: 52 },
} as const;

export type CurrencyCode = keyof typeof currencies;

// priceCents is always stored in EUR cents; convert + format for display in the chosen currency.
export function formatPriceCents(priceCents: number, currency: CurrencyCode) {
  const c = currencies[currency];
  const value = (priceCents / 100) * c.rate;
  return `${c.symbol}${value.toFixed(2)}`;
}
