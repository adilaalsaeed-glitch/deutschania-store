import Link from "next/link";
import { cookies } from "next/headers";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";

export default async function RewardsHubPage() {
  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);

  return (
    <SiteChrome>
      <section className="cart-page">
        <div className="cart-page-inner">
          <h1 className="auth-title">{t.rewards.title}</h1>
          <p className="auth-sub">{t.rewards.subtitle}</p>

          <div className="rewards-grid">
            <div className="rewards-card">
              <span className="rewards-card-icon">✦</span>
              <h2 className="rewards-card-title">{t.rewards.pointsTitle}</h2>
              <p className="rewards-card-desc">{t.rewards.pointsDesc}</p>
              <ul className="rewards-card-list">
                <li>{t.rewards.pointsEarnRule}</li>
                <li>{t.rewards.pointsNoExpiry}</li>
                <li>{t.rewards.pointsCap}</li>
              </ul>
              <Link href="/account/points" className="btn btn-brass" style={{ marginTop: 8, alignSelf: "flex-start" }}>
                {t.rewards.goToPoints}
              </Link>
            </div>

            <div className="rewards-card disabled">
              <span className="rewards-soon-badge">{t.rewards.comingSoon}</span>
              <span className="rewards-card-icon">🎟️</span>
              <h2 className="rewards-card-title">{t.rewards.couponsTitle}</h2>
              <p className="rewards-card-desc">{t.rewards.couponsDesc}</p>
            </div>

            <div className="rewards-card disabled">
              <span className="rewards-soon-badge">{t.rewards.comingSoon}</span>
              <span className="rewards-card-icon">🤝</span>
              <h2 className="rewards-card-title">{t.rewards.referralTitle}</h2>
              <p className="rewards-card-desc">{t.rewards.referralDesc}</p>
            </div>

            <div className="rewards-card disabled">
              <span className="rewards-soon-badge">{t.rewards.comingSoon}</span>
              <span className="rewards-card-icon">📣</span>
              <h2 className="rewards-card-title">{t.rewards.contentCouponTitle}</h2>
              <p className="rewards-card-desc">{t.rewards.contentCouponDesc}</p>
            </div>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
