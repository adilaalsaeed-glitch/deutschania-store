"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { EMBED_SCRIPT_SRC, type TestimonialItem } from "@/lib/testimonials";

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function embedHtml(item: TestimonialItem): string {
  const url = escapeAttr(item.videoUrl);
  if (item.platform === "instagram") {
    return `<blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14" style="margin:0;width:100%;"></blockquote>`;
  }
  if (item.platform === "tiktok") {
    return `<blockquote class="tiktok-embed" cite="${url}" style="margin:0;max-width:100%;min-width:280px;"><section></section></blockquote>`;
  }
  return "";
}

// Re-injecting a fresh <script> tag (rather than relying on window.instgrm/tiktokEmbed globals
// that may or may not still be listening) is the standard, most reliable way to get these
// platforms' embed libraries to re-scan the DOM for a newly-rendered blockquote in an SPA.
function reinjectEmbedScript(src: string) {
  document.querySelectorAll(`script[src="${src}"]`).forEach((el) => el.remove());
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  document.body.appendChild(script);
}

export function TestimonialModal({ item, onClose }: { item: TestimonialItem | null; onClose: () => void }) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!item || item.platform === "other") return;
    Promise.resolve().then(() => setUnavailable(false));
    reinjectEmbedScript(EMBED_SCRIPT_SRC[item.platform]);

    // Best-effort: the embed script doesn't expose a load/error callback we can hook, so we
    // just check a few seconds later whether it actually rendered an iframe.
    const timer = setTimeout(() => {
      const hasIframe = !!containerRef.current?.querySelector("iframe");
      if (!hasIframe) setUnavailable(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, [item]);

  function goFullscreen() {
    const el = containerRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }

  const open = !!item;

  return (
    <div className={`modal-backdrop${open ? " open" : ""}`} onClick={onClose}>
      <div className="modal testimonial-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        {item && (
          <>
            <div className="testimonial-modal-head">
              <span>{item.firstName}</span>
              <button type="button" className="btn btn-ghost-outline testimonial-fullscreen-btn" onClick={goFullscreen}>
                {t.testimonials.fullscreen}
              </button>
            </div>
            <div className="testimonial-embed-container" ref={containerRef}>
              {item.platform !== "other" && !unavailable && (
                <div key={item.id} dangerouslySetInnerHTML={{ __html: embedHtml(item) }} />
              )}
              {(item.platform === "other" || unavailable) && (
                <div className="testimonial-fallback">
                  <p>{t.testimonials.unavailable}</p>
                  <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-brass">
                    {t.testimonials.viewExternal}
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
