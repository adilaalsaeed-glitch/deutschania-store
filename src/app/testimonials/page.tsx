import { cookies } from "next/headers";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { TestimonialGrid } from "@/components/testimonials/TestimonialGrid";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { isTestimonialsEnabled } from "@/lib/settings";
import { getApprovedTestimonials } from "@/lib/testimonials-data";

export default async function TestimonialsPage() {
  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);

  const enabled = await isTestimonialsEnabled();

  if (!enabled) {
    return (
      <SiteChrome>
        <section className="cart-page">
          <div className="cart-page-inner confirm-box">
            <h1 className="auth-title">{t.testimonials.title}</h1>
            <p className="auth-sub">{t.testimonials.notAvailable}</p>
          </div>
        </section>
      </SiteChrome>
    );
  }

  const items = await getApprovedTestimonials();

  return (
    <SiteChrome>
      <section className="cart-page">
        <div className="cart-page-inner" style={{ maxWidth: 1100 }}>
          <h1 className="auth-title">{t.testimonials.title}</h1>
          <p className="auth-sub">{t.testimonials.subtitle}</p>
          {items.length === 0 ? (
            <p style={{ padding: "30px 0", opacity: 0.6 }}>{t.testimonials.empty}</p>
          ) : (
            <TestimonialGrid items={items} />
          )}
        </div>
      </section>
    </SiteChrome>
  );
}
