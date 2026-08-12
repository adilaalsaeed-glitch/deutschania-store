import type { I18nText } from "@/types/product";

export type RecentlyViewedProduct = {
  id: string;
  slug: string;
  name: I18nText;
  priceCents: number;
  imageUrl: string | null;
  icon: string;
  categoryColor: string;
};

const STORAGE_KEY = "deutschania:recentlyViewed";
const MAX_ITEMS = 8;

export function recordProductView(product: RecentlyViewedProduct) {
  if (typeof window === "undefined") return;
  const existing = getRecentlyViewed().filter((p) => p.id !== product.id);
  const next = [product, ...existing].slice(0, MAX_ITEMS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getRecentlyViewed(): RecentlyViewedProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
