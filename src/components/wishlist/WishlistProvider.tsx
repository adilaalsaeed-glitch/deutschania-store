"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { CartItemDTO } from "@/types/cart";

type WishlistItemDTO = { id: string; productId: string; product: CartItemDTO["product"] };

type WishlistContextValue = {
  items: WishlistItemDTO[];
  isWished: (productId: string) => boolean;
  toggle: (productId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  loading: boolean;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [items, setItems] = useState<WishlistItemDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    let cancelled = false;
    fetch("/api/wishlist")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setItems(data.items ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const isWished = useCallback((productId: string) => items.some((i) => i.productId === productId), [items]);

  const toggle = useCallback(
    async (productId: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (status !== "authenticated") {
        return { ok: false, error: "UNAUTHORIZED" };
      }
      const wished = items.some((i) => i.productId === productId);
      const res = await fetch("/api/wishlist", {
        method: wished ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.error ?? "UNKNOWN" };
      }
      const data = await res.json();
      setItems(data.items ?? []);
      return { ok: true };
    },
    [items, status]
  );

  return (
    <WishlistContext.Provider value={{ items, isWished, toggle, loading }}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
