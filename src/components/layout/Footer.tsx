"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="site">
      <div className="footer-inner">
        <p className="footer-about">{t.footer.about}</p>
        <div className="footer-meta">Deutschania</div>
      </div>
      <nav className="footer-legal">
        <Link href="/impressum">{t.footer.impressum}</Link>
        <Link href="/agb">{t.footer.agb}</Link>
        <Link href="/datenschutz">{t.footer.datenschutz}</Link>
        <Link href="/dateneinstellungen">{t.footer.dateneinstellungen}</Link>
      </nav>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Deutschania. {t.footer.rights}</span>
      </div>
    </footer>
  );
}
