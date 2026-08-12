"use client";

import { useEffect, useState } from "react";
import { useFlyToCart, type Flight } from "@/components/FlyToCartProvider";
import { ProductIcon } from "@/components/shop/ProductIcon";

const START_SIZE = 56;
const END_SIZE = 16;

function FlyingItem({ flight }: { flight: Flight }) {
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    // Start the transition on the next frame, after the initial (start) position paints.
    const raf = requestAnimationFrame(() => setLanded(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const size = landed ? END_SIZE : START_SIZE;
  const center = landed ? flight.endCenter : flight.startCenter;

  return (
    <div
      className="fly-item"
      style={{
        top: center.y - size / 2,
        left: center.x - size / 2,
        width: size,
        height: size,
        opacity: landed ? 0 : 1,
      }}
    >
      {flight.imageUrl ? <img src={flight.imageUrl} alt="" /> : <ProductIcon icon={flight.icon} />}
    </div>
  );
}

export function FlyToCartOverlay() {
  const { flights } = useFlyToCart();
  return (
    <>
      {flights.map((flight) => (
        <FlyingItem key={flight.id} flight={flight} />
      ))}
    </>
  );
}
