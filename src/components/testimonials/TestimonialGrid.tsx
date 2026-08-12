"use client";

import { useState } from "react";
import { TestimonialCard } from "@/components/testimonials/TestimonialCard";
import { TestimonialModal } from "@/components/testimonials/TestimonialModal";
import type { TestimonialItem } from "@/lib/testimonials";

export function TestimonialGrid({ items }: { items: TestimonialItem[] }) {
  const [selected, setSelected] = useState<TestimonialItem | null>(null);

  return (
    <>
      <div className="testimonials-grid">
        {items.map((item) => (
          <TestimonialCard key={item.id} item={item} onClick={() => setSelected(item)} />
        ))}
      </div>
      <TestimonialModal item={selected} onClose={() => setSelected(null)} />
    </>
  );
}
