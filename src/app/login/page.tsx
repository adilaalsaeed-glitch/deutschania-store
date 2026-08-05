"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { useLocale } from "@/components/LocaleProvider";

export default function LoginPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setSubmitting(false);
    if (res?.error) {
      setError(t.errors.INVALID_CREDENTIALS);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <SiteChrome>
      <section className="auth-page">
        <div className="auth-inner">
          <nav className="pp-breadcrumb">
            <Link href="/">{t.nav.home}</Link>
          </nav>
          <h1 className="auth-title">{t.auth.loginTitle}</h1>
          <p className="auth-sub">{t.auth.loginSubtitle}</p>
          <form className="auth-form" onSubmit={onSubmit}>
            <div className="field">
              <label>{t.auth.email}</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>{t.auth.password}</label>
              <div className="pw-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">
                  👁
                </button>
              </div>
            </div>
            {error && <p className="field-error">{error}</p>}
            <button className="btn btn-brass btn-block" type="submit" disabled={submitting}>
              {t.auth.submit}
            </button>
          </form>
          <Link href="/register" className="auth-switch-btn" style={{ display: "block", textAlign: "center" }}>
            {t.auth.createAccount}
          </Link>
        </div>
      </section>
    </SiteChrome>
  );
}
