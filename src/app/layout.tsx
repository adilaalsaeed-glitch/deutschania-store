import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SessionProvider } from "next-auth/react";
import { LocaleProvider } from "@/components/LocaleProvider";
import { FlyToCartProvider } from "@/components/FlyToCartProvider";
import { FlyToCartOverlay } from "@/components/FlyToCartOverlay";
import { CartProvider } from "@/components/cart/CartProvider";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";
import { CompareProvider } from "@/components/compare/CompareProvider";
import { CompareModal } from "@/components/compare/CompareModal";
import { SignOutConfirmProvider } from "@/components/SignOutConfirmProvider";
import { SignOutConfirmModal } from "@/components/SignOutConfirmModal";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { parseConsentCookie, COOKIE_NAME as CONSENT_COOKIE_NAME } from "@/lib/cookieConsent";
import { defaultLocale, dir, isLocale, type Locale } from "@/i18n/config";
import "./globals.css";

export const metadata: Metadata = {
  title: "deutschania — متجر المنتجات الألمانية",
  description: "Authentic German products, delivered across the Arab world.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const initialConsent = parseConsentCookie(jar.get(CONSENT_COOKIE_NAME)?.value);

  return (
    <html lang={locale} dir={dir(locale)} data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={dir(locale) === "rtl" ? "rtl" : ""}>
        <SessionProvider>
          <LocaleProvider initialLocale={locale}>
            <FlyToCartProvider>
              <CartProvider>
                <WishlistProvider>
                  <CompareProvider>
                    <SignOutConfirmProvider>
                      {children}
                      <CompareModal />
                      <SignOutConfirmModal />
                      <FlyToCartOverlay />
                      <CookieConsentBanner initialConsent={initialConsent} />
                    </SignOutConfirmProvider>
                  </CompareProvider>
                </WishlistProvider>
              </CartProvider>
            </FlyToCartProvider>
          </LocaleProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
