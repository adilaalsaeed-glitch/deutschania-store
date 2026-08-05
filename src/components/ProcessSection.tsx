"use client";

import { useLocale } from "@/components/LocaleProvider";

export function ProcessSection() {
  const { t } = useLocale();
  const steps = [
    { t: t.process.s1t, d: t.process.s1d },
    { t: t.process.s2t, d: t.process.s2d },
    { t: t.process.s3t, d: t.process.s3d },
    { t: t.process.s4t, d: t.process.s4d },
  ];

  return (
    <section className="section dark">
      <div className="section-inner">
        <div className="section-head">
          <span className="eyebrow">{t.process.eyebrow}</span>
          <h2 className="display">{t.process.title}</h2>
        </div>
        <div className="process-grid">
          {steps.map((s, i) => (
            <div className="step" key={i}>
              <span className="idx">0{i + 1}</span>
              <h4>{s.t}</h4>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
