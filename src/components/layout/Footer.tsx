"use client";

import { useLocale } from "@/components/LocaleProvider";

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="site">
      <div className="footer-inner">
        <p className="footer-about">{t.footer.about}</p>
        <div className="footer-meta">deutschania GmbH</div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} deutschania. {t.footer.rights}</span>
      </div>
    </footer>
  );
}
