export type I18nText = { ar: string; de: string; en: string };
export type AttrRow = { label: string; value: string };

export type ProductListItem = {
  id: string;
  slug: string;
  brand: string;
  name: I18nText;
  priceCents: number;
  currency: string;
  icon: string;
  imageUrl: string | null;
  origin: string;
  categoryKey: string;
  featured: boolean;
  stockQuantity: number;
  category: {
    key: string;
    label: I18nText;
    icon: string;
    color: string;
  };
};

export type ProductDetail = ProductListItem & {
  description: I18nText | null;
  attributes: Record<string, AttrRow[]> | null;
};
