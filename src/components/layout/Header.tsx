"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useLocale } from "@/components/LocaleProvider";
import { useCart } from "@/components/cart/CartProvider";
import { useWishlist } from "@/components/wishlist/WishlistProvider";
import { useCompare } from "@/components/compare/CompareProvider";
import { subCategories } from "@/data/subcategories";
import type { locales, Locale } from "@/i18n/config";

const langNames: Record<(typeof locales)[number], string> = {
  ar: "العربية",
  de: "Deutsch",
  en: "English",
};

type Category = { key: string; label: Record<Locale, string>; icon: string };

export function Header({
  searchQuery,
  onSearchChange,
  onOpenMenu,
  onOpenCart,
  onOpenFilters,
  categories = [],
  activeCategory = "all",
  onSelectCategory,
  onSelectSubcategory,
  onGoHome,
  wishOnly = false,
  onToggleWishOnly,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenMenu: () => void;
  onOpenCart: () => void;
  onOpenFilters: () => void;
  categories?: Category[];
  activeCategory?: string;
  onSelectCategory?: (key: string) => void;
  onSelectSubcategory?: (categoryKey: string, term: string) => void;
  onGoHome?: () => void;
  wishOnly?: boolean;
  onToggleWishOnly?: () => void;
}) {
  const { locale, setLocale, t } = useLocale();
  const { count } = useCart();
  const { items: wishItems } = useWishlist();
  const { ids: compareIds, openModal: openCompareModal } = useCompare();
  const { data: session } = useSession();
  const [langOpen, setLangOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <header className="site">
      <div className="topbar">
        <Link href="/" className="brand" onClick={() => onGoHome?.()}>
          <svg className="mark" viewBox="0 0 50 46" aria-hidden="true">
            <path d="M6 44 L6 24 A19 22 0 0 1 44 24 L44 44" fill="none" stroke="#F5F3EE" strokeWidth="6" strokeLinecap="round" />
            <circle cx="25" cy="6" r="3.4" fill="#FCEAAE" />
            <rect x="21" y="28" width="8" height="16" fill="#FCEAAE" />
          </svg>
          <span>deutschania</span>
        </Link>

        <div className="search-bar">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.shop.searchPh}
          />
          <button aria-label="Search" onClick={() => onOpenFilters()}>
            🔍
          </button>
        </div>

        <div className="nav-right">
          {session?.user ? (
            <div className="lang-menu-wrap">
              <button
                className="icon-circle"
                aria-label="Account"
                onClick={() => setAccountOpen((v) => !v)}
                title={session.user.name ?? ""}
              >
                👤
              </button>
              <div className={`lang-menu${accountOpen ? " open" : ""}`}>
                <Link href="/account/rewards" onClick={() => setAccountOpen(false)}>
                  {t.nav.rewardsPrograms}
                </Link>
                <Link href="/account/points" onClick={() => setAccountOpen(false)}>
                  {t.nav.myPoints}
                </Link>
                <button
                  onClick={() => {
                    setAccountOpen(false);
                    signOut();
                  }}
                >
                  {t.nav.signOut}
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="icon-circle" aria-label="Account">
              👤
            </Link>
          )}
          <button className="icon-circle" aria-label="Cart" onClick={onOpenCart}>
            🛒{count > 0 && <span className="icon-badge">{count}</span>}
          </button>
          <button
            className={`icon-circle${wishOnly ? " active-toggle" : ""}`}
            aria-label="Wishlist"
            onClick={onToggleWishOnly}
          >
            ♡{wishItems.length > 0 && <span className="icon-badge">{wishItems.length}</span>}
          </button>
          <button className="icon-circle" aria-label="Compare" onClick={openCompareModal}>
            ⇄{compareIds.length > 0 && <span className="icon-badge">{compareIds.length}</span>}
          </button>
          <div className="lang-menu-wrap">
            <div className="lang-label-wrap">
              <span className="lang-btn-label">{langNames[locale]}</span>
              <button className="icon-circle" aria-label="Language" onClick={() => setLangOpen((v) => !v)}>
                🌐
              </button>
            </div>
            <div className={`lang-menu${langOpen ? " open" : ""}`}>
              {(Object.keys(langNames) as (keyof typeof langNames)[]).map((l) => (
                <button
                  key={l}
                  className={l === locale ? "active" : ""}
                  onClick={() => {
                    setLocale(l);
                    setLangOpen(false);
                  }}
                >
                  {langNames[l]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="catbar">
        <div className="catbar-row">
          <button className="icon-btn" aria-label="Menu" onClick={onOpenMenu}>
            ☰ <span>{t.nav.all}</span>
          </button>
          <Link href="/" className="icon-btn" aria-label="Home" onClick={() => onGoHome?.()}>
            🏠 <span>{t.nav.home}</span>
          </Link>
          <div className="catbar-inner">
            {categories.map((c) => {
              const groups = subCategories[locale][c.key] ?? [];
              const multi = groups.length > 1;
              return (
                <div className="cat-item" key={c.key}>
                  <a className={activeCategory === c.key ? "active" : ""} onClick={() => onSelectCategory?.(c.key)}>
                    {groups.length > 0 && (
                      <svg className="chev" width="6" height="10" viewBox="0 0 6 10" aria-hidden="true">
                        <path d="M5 1 L1 5 L5 9" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {c.icon} {c.label[locale]}
                  </a>
                  {groups.length > 0 && (
                    <div className={`cat-dropdown${multi ? " multi-col" : ""}`}>
                      {groups.map((g, gi) => (
                        <div className="cat-dropdown-col" key={gi}>
                          {g.title && <div className="cat-dropdown-heading">{g.title}</div>}
                          {g.items.map((item) => (
                            <button
                              key={item}
                              className="cat-dropdown-item"
                              onClick={() => onSelectSubcategory?.(c.key, item)}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
