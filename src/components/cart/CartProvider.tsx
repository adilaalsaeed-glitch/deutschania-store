"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItemDTO } from "@/types/cart";

type CartResult = { ok: boolean; error?: string };

type CartContextValue = {
  items: CartItemDTO[];
  loading: boolean;
  count: number;
  add: (productId: string, quantity?: number) => Promise<CartResult>;
  setQuantity: (productId: string, quantity: number) => Promise<CartResult>;
  remove: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/cart");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cart")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setItems(data.items ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const add = useCallback(async (productId: string, quantity = 1): Promise<CartResult> => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    setItems(data.items ?? []);
    return { ok: true };
  }, []);

  const setQuantity = useCallback(async (productId: string, quantity: number): Promise<CartResult> => {
    const res = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    setItems(data.items ?? []);
    return { ok: true };
  }, []);

  const remove = useCallback(async (productId: string) => {
    const res = await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const data = await res.json();
    setItems(data.items ?? []);
  }, []);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const value = useMemo(
    () => ({ items, loading, count, add, setQuantity, remove, refresh }),
    [items, loading, count, add, setQuantity, remove, refresh]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
