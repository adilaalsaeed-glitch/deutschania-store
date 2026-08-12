"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { TestimonialCard } from "@/components/testimonials/TestimonialCard";
import { TestimonialModal } from "@/components/testimonials/TestimonialModal";
import type { TestimonialItem } from "@/lib/testimonials";

export function TestimonialsSnippet({ items }: { items: TestimonialItem[] }) {
  const { t } = useLocale();
  const [selected, setSelected] = useState<TestimonialItem | null>(null);

  if (items.length === 0) return null;

  return (
    <section className="testimonials-section">
      <div className="testimonials-section-inner">
        <div className="testimonials-head">
          <h2>{t.testimonials.title}</h2>
          <Link href="/testimonials">{t.testimonials.seeMore}</Link>
        </div>
        <div className="testimonials-grid">
          {items.map((item) => (
            <TestimonialCard key={item.id} item={item} onClick={() => setSelected(item)} />
          ))}
        </div>
      </div>
      <TestimonialModal item={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
