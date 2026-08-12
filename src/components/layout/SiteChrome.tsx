"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { SideMenu } from "@/components/layout/SideMenu";
import { Footer } from "@/components/layout/Footer";
import { MarketNotice } from "@/components/MarketNotice";
import { useLocale } from "@/components/LocaleProvider";
import type { Locale } from "@/i18n/config";

type Category = { key: string; label: Record<Locale, string>; icon: string; color: string };

// Header + drawers for secondary pages (product, auth, cart, checkout) that aren't the storefront home.
export function SiteChrome({
  categories = [],
  children,
}: {
  categories?: Category[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <div className="announce">
        <span>{t.announce}</span>
      </div>
      <MarketNotice />
      <Header
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q) router.push(`/?q=${encodeURIComponent(q)}#shop`);
        }}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenCart={() => router.push("/cart")}
        onOpenFilters={() => router.push("/#shop")}
        categories={categories}
        onSelectCategory={(key) => router.push(`/?cat=${key}#shop`)}
        onSelectSubcategory={(key) => router.push(`/?cat=${key}#shop`)}
        onToggleWishOnly={() => router.push("/?wish=1#shop")}
      />
      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        categories={categories}
        onSelectCategory={(key) => router.push(`/?cat=${key}#shop`)}
        onSelectSubcategory={(key) => router.push(`/?cat=${key}#shop`)}
      />
      {children}
      <Footer />
    </>
  );
}
