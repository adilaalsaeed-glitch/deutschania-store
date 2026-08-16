"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { useLocale } from "@/components/LocaleProvider";
import { useCart } from "@/components/cart/CartProvider";

export default function LoginPage() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const { refresh: refreshCart } = useCart();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUnverified(false);
    setResendDone(false);
    setSubmitting(true);

    const res = await signIn("credentials", { email, password, redirect: false });

    if (res?.error) {
      // authorize() rejects both "wrong password" and "unverified email" the same way
      // (returns null), so check separately here to show the right message.
      const statusRes = await fetch(`/api/register/status?email=${encodeURIComponent(email)}`);
      const status = await statusRes.json().catch(() => null);
      setSubmitting(false);
      if (status?.exists && status.suspended) {
        setError(t.errors.ACCOUNT_SUSPENDED);
      } else if (status?.exists && !status.verified) {
        setUnverified(true);
        setError(t.auth.emailNotVerified);
      } else {
        setError(t.errors.INVALID_CREDENTIALS);
      }
      return;
    }

    // Migrate anything added to the cart before login (a guest-session cart) into this
    // account's cart - resolveCartIdentity() only ever looks at the guest cookie while logged
    // out, so without this step those items become invisible the moment login succeeds.
    // Then re-fetch the cart context itself - the merge happens server-side, but the header
    // badge and any other cart UI already mounted are holding pre-login client state and won't
    // see the merged items until this runs.
    await fetch("/api/cart/merge", { method: "POST" }).catch(() => {});
    await refreshCart();

    setSubmitting(false);
    router.push("/");
    router.refresh();
  }

  async function resendVerification() {
    setResending(true);
    await fetch("/api/register/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, lang: locale }),
    });
    setResending(false);
    setResendDone(true);
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
              <Link href="/forgot-password" className="forgot-link">
                {t.auth.forgotPassword}
              </Link>
            </div>
            {error && <p className="field-error">{error}</p>}
            {unverified &&
              (resendDone ? (
                <p className="form-note">{t.auth.resendSent}</p>
              ) : (
                <button
                  type="button"
                  className="desc-edit-btn"
                  onClick={resendVerification}
                  disabled={resending}
                  style={{ marginBottom: 14 }}
                >
                  {resending ? "…" : t.auth.resendVerification}
                </button>
              ))}
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
