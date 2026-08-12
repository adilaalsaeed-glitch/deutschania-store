"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { Header } from "@/components/layout/Header";
import { SideMenu } from "@/components/layout/SideMenu";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/Hero";
import { TrustBar } from "@/components/TrustBar";
import { BrandsCarousel } from "@/components/BrandsCarousel";
import { ProductCarousel } from "@/components/shop/ProductCarousel";
import { ShopSection } from "@/components/shop/ShopSection";
import { ProcessSection } from "@/components/ProcessSection";
import { MarketNotice } from "@/components/MarketNotice";
import { TestimonialsSnippet } from "@/components/testimonials/TestimonialsSnippet";
import type { ProductListItem } from "@/types/product";
import type { Locale } from "@/i18n/config";
import type { TestimonialItem } from "@/lib/testimonials";

// localStorage isn't available during SSR, so this section only ever renders client-side
// (same reasoning as the recently-viewed section on the account dashboard).
const HomeRecentlyViewed = dynamic(() => import("@/components/HomeRecentlyViewed").then((m) => m.HomeRecentlyViewed), {
  ssr: false,
});

type Category = { key: string; label: Record<Locale, string>; icon: string; color: string };

export function StorefrontClient({
  products,
  categories,
  initialCategoryKey = "all",
  initialSearchQuery = "",
  initialWishOnly = false,
  testimonials = [],
  newArrivals = [],
  topSellers = [],
  brands = [],
  recommended = [],
}: {
  products: ProductListItem[];
  categories: Category[];
  initialCategoryKey?: string;
  initialSearchQuery?: string;
  initialWishOnly?: boolean;
  testimonials?: TestimonialItem[];
  newArrivals?: ProductListItem[];
  topSellers?: ProductListItem[];
  brands?: string[];
  recommended?: ProductListItem[];
}) {
  const { t } = useLocale();
  const router = useRouter();
  // Initialized directly from server-read searchParams (via props), not window.location:
  // the parent page.tsx keys this component on those params, so a fresh instance (and thus
  // fresh initial state here) is guaranteed whenever ?cat=/?q= actually change - including a
  // plain Link back to "/", which Next.js would otherwise treat as a same-route navigation
  // that reuses this component instance and leaves stale local state behind.
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryKey, setCategoryKey] = useState(initialCategoryKey);
  const [wishOnly, setWishOnly] = useState(initialWishOnly);
  // Bumped only by goHome() below - remounts ShopSection so its own uncontrolled filters
  // (price range, brand checkboxes, sort) reset too. Not tied to categoryKey directly, so
  // ordinary category selection (dropdown/topbar/side menu) doesn't wipe those out.
  const [resetToken, setResetToken] = useState(0);

  useEffect(() => {
    if (window.location.hash === "#shop") {
      document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  function scrollToShop() {
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  }

  function selectCategory(key: string) {
    setCategoryKey(key);
    scrollToShop();
  }

  // Subcategory items narrow to the parent category; the catalog is too small (and the
  // subcategory term doesn't reliably substring-match translated product names) to also
  // filter by the specific item text.
  function selectSubcategory(key: string) {
    selectCategory(key);
  }

  // "Home" should always mean "clean slate", even when already on this page (e.g. filtered
  // via the top bar or side menu without ever touching the URL, so a plain Link to "/" is a
  // same-route no-op and won't reset anything on its own).
  function goHome() {
    setCategoryKey("all");
    setSearchQuery("");
    setWishOnly(false);
    setResetToken((n) => n + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleWishOnly() {
    setWishOnly((v) => !v);
    scrollToShop();
  }

  return (
    <>
      <div className="announce">
        <span>{t.announce}</span>
      </div>
      <MarketNotice />
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenCart={() => router.push("/cart")}
        onOpenFilters={scrollToShop}
        categories={categories}
        activeCategory={categoryKey}
        onSelectCategory={selectCategory}
        onSelectSubcategory={selectSubcategory}
        onGoHome={goHome}
        wishOnly={wishOnly}
        onToggleWishOnly={toggleWishOnly}
      />
      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        categories={categories}
        onSelectCategory={selectCategory}
        onSelectSubcategory={selectSubcategory}
        onGoHome={goHome}
      />
      <Hero onShop={scrollToShop} />
      <TrustBar />
      <BrandsCarousel brands={brands} />
      <ProductCarousel eyebrow={t.home.topSellersEyebrow} title={t.home.topSellersTitle} products={topSellers} />
      <ProductCarousel eyebrow={t.home.newArrivalsEyebrow} title={t.home.newArrivalsTitle} products={newArrivals} />
      <HomeRecentlyViewed />
      <ProductCarousel eyebrow={t.home.recommendedEyebrow} title={t.home.recommendedTitle} products={recommended} />
      <ShopSection
        key={resetToken}
        products={products}
        categories={categories}
        searchQuery={searchQuery}
        categoryKey={categoryKey}
        onCategoryChange={setCategoryKey}
        wishOnly={wishOnly}
      />
      <TestimonialsSnippet items={testimonials} />
      <ProcessSection />
      <Footer />
    </>
  );
}
