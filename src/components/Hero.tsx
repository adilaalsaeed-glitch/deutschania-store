"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

const SLIDE_COUNT = 3;
const AUTOPLAY_MS = 6000;

export function Hero({ onShop }: { onShop: () => void }) {
  const { t } = useLocale();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDE_COUNT), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, []);

  function go(i: number) {
    setIndex(((i % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT);
  }

  return (
    <section className="hero">
      <div className="hero-carousel">
        <div className={`hero-slide${index === 0 ? " active" : ""}`}>
          <div className="hero-scene hero-scene-0" />
          <div className="hero-slide-inner">
            <span className="eyebrow">{t.hero.eyebrow}</span>
            <h1 className="hero-title display">{t.hero.title}</h1>
            <p className="subtitle">{t.hero.subtitle}</p>
            <div className="hero-ctas">
              <button className="btn btn-brass" onClick={onShop}>
                {t.hero.cta1}
              </button>
            </div>
          </div>
        </div>

        <div className={`hero-slide${index === 1 ? " active" : ""}`}>
          <div className="hero-scene hero-scene-1" />
          <div className="hero-slide-inner">
            <div className="promo-pct">30%</div>
            <div className="promo-tagline">{t.promo.s1}</div>
          </div>
        </div>

        <div className={`hero-slide${index === 2 ? " active" : ""}`}>
          <div className="hero-scene hero-scene-2" />
          <div className="hero-slide-inner">
            <div className="promo-pct">{t.promo.s2num}</div>
            <div className="promo-tagline">{t.promo.s2}</div>
          </div>
        </div>

        <button className="promo-arrow promo-prev" aria-label="Previous" onClick={() => go(index - 1)}>
          ‹
        </button>
        <button className="promo-arrow promo-next" aria-label="Next" onClick={() => go(index + 1)}>
          ›
        </button>
        <div className="promo-dots">
          {Array.from({ length: SLIDE_COUNT }, (_, i) => (
            <button
              key={i}
              className={i === index ? "active" : ""}
              aria-label={`Slide ${i + 1}`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
