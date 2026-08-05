"use client";

import { useRouter } from "next/navigation";
import { useWishlist } from "@/components/wishlist/WishlistProvider";

export function WishButton({ productId, className }: { productId: string; className: string }) {
  const { isWished, toggle } = useWishlist();
  const router = useRouter();
  const wished = isWished(productId);

  return (
    <button
      className={`${className}${wished ? " on" : ""}`}
      aria-label="Wishlist"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const result = await toggle(productId);
        if (!result.ok && result.error === "UNAUTHORIZED") {
          router.push("/login");
        }
      }}
    >
      {wished ? "♥" : "♡"}
    </button>
  );
}
