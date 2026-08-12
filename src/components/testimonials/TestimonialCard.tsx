"use client";

import { useLocale } from "@/components/LocaleProvider";
import type { TestimonialItem } from "@/lib/testimonials";

const PLATFORM_ICON: Record<TestimonialItem["platform"], string> = {
  instagram: "📷",
  tiktok: "🎵",
  other: "▶️",
};

export function TestimonialCard({ item, onClick }: { item: TestimonialItem; onClick: () => void }) {
  const { t } = useLocale();
  return (
    <button type="button" className="testimonial-card" onClick={onClick}>
      <div className="testimonial-card-media">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt="" loading="lazy" />
        ) : (
          <span className="testimonial-card-placeholder">{PLATFORM_ICON[item.platform]}</span>
        )}
        <span className="testimonial-play-badge">▶</span>
      </div>
      <div className="testimonial-card-name">
        {t.testimonials.byCustomer.replace("{name}", item.firstName)}
      </div>
    </button>
  );
}
