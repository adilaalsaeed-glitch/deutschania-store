"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { useLocale } from "@/components/LocaleProvider";

export default function ForgotPasswordPage() {
  const { locale, t } = useLocale();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, lang: locale }),
    });
    // Always show the same outcome, regardless of whether the email is registered.
    setSubmitting(false);
    setSent(true);
  }

  return (
    <SiteChrome>
      <section className="auth-page">
        <div className="auth-inner">
          <nav className="pp-breadcrumb">
            <Link href="/">{t.nav.home}</Link>
          </nav>
          {sent ? (
            <div className="confirm-box">
              <h1 className="auth-title">{t.auth.forgotPasswordTitle}</h1>
              <p className="auth-sub">{t.auth.forgotPasswordSent}</p>
              <Link href="/login" className="btn btn-brass" style={{ display: "inline-flex", marginTop: 12 }}>
                {t.auth.goToLogin}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="auth-title">{t.auth.forgotPasswordTitle}</h1>
              <p className="auth-sub">{t.auth.forgotPasswordSubtitle}</p>
              <form className="auth-form" onSubmit={onSubmit}>
                <div className="field">
                  <label>{t.auth.email}</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <button className="btn btn-brass btn-block" type="submit" disabled={submitting}>
                  {submitting ? "…" : t.auth.forgotPasswordSubmit}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </SiteChrome>
  );
}
