"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type Point = { x: number; y: number };

export type Flight = {
  id: number;
  imageUrl: string | null;
  icon: string;
  startCenter: Point;
  endCenter: Point;
};

type FlyToCartContextValue = {
  flights: Flight[];
  registerCartIcon: (el: HTMLElement | null) => void;
  fly: (sourceEl: HTMLElement, imageUrl: string | null, icon: string) => void;
};

const FlyToCartContext = createContext<FlyToCartContextValue | null>(null);
const FLIGHT_DURATION_MS = 650;

function centerOf(el: HTMLElement): Point {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function FlyToCartProvider({ children }: { children: React.ReactNode }) {
  const cartIconRef = useRef<HTMLElement | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const nextId = useRef(0);

  const registerCartIcon = useCallback((el: HTMLElement | null) => {
    cartIconRef.current = el;
  }, []);

  const fly = useCallback((sourceEl: HTMLElement, imageUrl: string | null, icon: string) => {
    const target = cartIconRef.current;
    if (!target) return;

    const id = ++nextId.current;
    setFlights((prev) => [
      ...prev,
      { id, imageUrl, icon, startCenter: centerOf(sourceEl), endCenter: centerOf(target) },
    ]);

    setTimeout(() => {
      setFlights((prev) => prev.filter((f) => f.id !== id));
      target.classList.add("cart-bump");
      setTimeout(() => target.classList.remove("cart-bump"), 300);
    }, FLIGHT_DURATION_MS);
  }, []);

  return (
    <FlyToCartContext.Provider value={{ flights, registerCartIcon, fly }}>
      {children}
    </FlyToCartContext.Provider>
  );
}

export function useFlyToCart() {
  const ctx = useContext(FlyToCartContext);
  if (!ctx) throw new Error("useFlyToCart must be used within FlyToCartProvider");
  return ctx;
}
