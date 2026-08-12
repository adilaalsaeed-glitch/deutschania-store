"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLocale } from "@/components/LocaleProvider";
import { useSignOutConfirm } from "@/components/SignOutConfirmProvider";
import { subCategories } from "@/data/subcategories";
import type { Locale } from "@/i18n/config";

type Category = { key: string; label: Record<Locale, string>; icon: string };

export function SideMenu({
  open,
  onClose,
  categories,
  onSelectCategory,
  onSelectSubcategory,
  onGoHome,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onSelectCategory: (key: string) => void;
  onSelectSubcategory?: (categoryKey: string, term: string) => void;
  onGoHome?: () => void;
}) {
  const { locale, t } = useLocale();
  const { data: session } = useSession();
  const { requestSignOut } = useSignOutConfirm();
  const [flyoutCat, setFlyoutCat] = useState<string | null>(null);

  function close() {
    setFlyoutCat(null);
    onClose();
  }

  const activeGroups = flyoutCat ? (subCategories[locale][flyoutCat] ?? []) : [];
  const activeCategoryMeta = categories.find((c) => c.key === flyoutCat);

  return (
    <>
      <div className={`backdrop${open ? " open" : ""}`} onClick={close} />
      <aside className={`side-menu${open ? " open" : ""}`}>
        <div className="sm-head">
          <span className="brand">deutschania</span>
          <button className="sm-close" onClick={close}>
            ✕
          </button>
        </div>
        <div className="sm-body-wrap">
          <div className="sm-body">
            <Link
              href="/"
              className="sm-link"
              onClick={() => {
                onGoHome?.();
                close();
              }}
            >
              🏠 {t.nav.home}
            </Link>
            <div className="sm-section">{t.nav.groupDe}</div>
            {categories.map((c) => {
              const groups = subCategories[locale][c.key] ?? [];
              return (
                <div className="sm-cat-row" key={c.key}>
                  <button
                    className="sm-link"
                    onClick={() => {
                      onSelectCategory(c.key);
                      close();
                    }}
                  >
                    {c.icon} {c.label[locale]}
                  </button>
                  {groups.length > 0 && (
                    <button
                      className="sm-cat-toggle"
                      aria-label="Expand"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFlyoutCat(c.key);
                      }}
                    >
                      <svg width="6" height="10" viewBox="0 0 6 10" aria-hidden="true">
                        <path d="M5 1 L1 5 L5 9" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className={`sm-flyout${flyoutCat ? " open" : ""}`}>
            <button className="sm-flyout-back" onClick={() => setFlyoutCat(null)}>
              <span>{t.nav.mainMenu}</span> →
            </button>
            {activeCategoryMeta && (
              <div className="sm-flyout-title">
                {activeCategoryMeta.icon} {activeCategoryMeta.label[locale]}
              </div>
            )}
            {activeGroups.map((g, gi) => (
              <div className="sm-sub-group" key={gi}>
                {g.title && <div className="sm-sub-heading">{g.title}</div>}
                {g.items.map((item) => (
                  <button
                    key={item}
                    className="sm-sub-item"
                    onClick={() => {
                      if (flyoutCat) onSelectSubcategory?.(flyoutCat, item);
                      close();
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="sm-foot">
          {session?.user ? (
            <>
              <Link href="/account" className="sm-link" style={{ border: "none", padding: "10px 0" }} onClick={close}>
                {t.account.dashboardTitle}
              </Link>
              {session.user.role === "ADMIN" && (
                <Link href="/admin/products" className="sm-link" style={{ border: "none", padding: "10px 0" }} onClick={close}>
                  🛠️ {t.nav.adminDashboard}
                </Link>
              )}
              <button
                type="button"
                className="sm-link"
                style={{ border: "none", padding: "10px 0", width: "100%", textAlign: "start", background: "none" }}
                onClick={() => {
                  close();
                  requestSignOut();
                }}
              >
                {t.account.menu.logout}
              </button>
            </>
          ) : (
            <Link href="/login" className="sm-link" style={{ border: "none", padding: "10px 0" }} onClick={close}>
              {t.nav.login}
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
