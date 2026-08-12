"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

export function ComingSoon({ title }: { title: string }) {
  const { t } = useLocale();

  return (
    <div className="coming-soon">
      <div className="coming-soon-icon">🛠</div>
      <h1 className="auth-title">{title}</h1>
      <p className="auth-sub">{t.account.comingSoonDesc}</p>
      <Link href="/account" className="btn btn-brass" style={{ display: "inline-flex" }}>
        {t.account.backToAccount}
      </Link>
    </div>
  );
}
