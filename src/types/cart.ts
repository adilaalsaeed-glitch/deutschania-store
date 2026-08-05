export type CartProductJson = {
  ar: string;
  de: string;
  en: string;
};

export type CartItemDTO = {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    slug: string;
    brand: string;
    name: CartProductJson;
    priceCents: number;
    currency: string;
    icon: string;
    imageUrl: string | null;
    categoryKey: string;
  };
};
