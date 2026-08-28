import Link from "next/link";
import { cookies } from "next/headers";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isReferralsEnabled } from "@/lib/settings";
import { referralUrl, siteOrigin } from "@/lib/referral";
import { RewardsBonusCards } from "@/components/account/RewardsBonusCards";

export default async function RewardsHubPage() {
  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);

  const [referralsEnabled, featuredProduct] = await Promise.all([
    isReferralsEnabled(),
    prisma.product.findFirst({
      where: { featured: true, category: { archived: false } },
      orderBy: { updatedAt: "desc" },
      select: {
        slug: true,
        name: true,
        priceCents: true,
        imageUrl: true,
        icon: true,
        category: { select: { color: true } },
      },
    }),
  ]);
  const session = referralsEnabled ? await auth() : null;
  const myReferralLink = session?.user?.id ? referralUrl(siteOrigin(), session.user.id) : null;

  return (
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

            {referralsEnabled ? (
              <div className="rewards-card">
                <span className="rewards-card-icon">🤝</span>
                <h2 className="rewards-card-title">{t.rewards.referralTitle}</h2>
                <p className="rewards-card-desc">{t.rewards.referralDesc}</p>
                {myReferralLink ? (
                  <>
                    <p className="referral-hub-link">{myReferralLink}</p>
                    <Link href="/account/referrals" className="btn btn-brass" style={{ marginTop: 8, alignSelf: "flex-start" }}>
                      {t.referral.goToReferrals}
                    </Link>
                  </>
                ) : (
                  <Link href="/login" className="btn btn-brass" style={{ marginTop: 8, alignSelf: "flex-start" }}>
                    {t.nav.login}
                  </Link>
                )}
              </div>
            ) : (
              <div className="rewards-card disabled">
                <span className="rewards-soon-badge">{t.rewards.comingSoon}</span>
                <span className="rewards-card-icon">🤝</span>
                <h2 className="rewards-card-title">{t.rewards.referralTitle}</h2>
                <p className="rewards-card-desc">{t.rewards.referralDesc}</p>
              </div>
            )}

            <RewardsBonusCards
              featuredProduct={
                featuredProduct
                  ? {
                      slug: featuredProduct.slug,
                      name: featuredProduct.name as Record<Locale, string>,
                      priceCents: featuredProduct.priceCents,
                      imageUrl: featuredProduct.imageUrl,
                      icon: featuredProduct.icon,
                      categoryColor: featuredProduct.category.color,
                    }
                  : null
              }
            />
          </div>
        </div>
      </section>
  );
}
