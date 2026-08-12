"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useLocale();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t.auth.passwordMismatch);
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(t.errors[data.error as keyof typeof t.errors] ?? t.errors.UNKNOWN);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="confirm-box">
        <h1 className="auth-title">{t.auth.resetPasswordSuccessTitle}</h1>
        <p className="auth-sub">{t.auth.resetPasswordSuccessDesc}</p>
        <Link href="/login" className="btn btn-brass" style={{ display: "inline-flex", marginTop: 12 }}>
          {t.auth.goToLogin}
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="auth-title">{t.auth.resetPasswordTitle}</h1>
      <p className="auth-sub">{t.auth.resetPasswordSubtitle}</p>
      <form className="auth-form" onSubmit={onSubmit}>
        <div className="field">
          <label>{t.auth.password}</label>
          <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="field">
          <label>{t.auth.confirmPassword}</label>
          <input
            required
            minLength={8}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {error && <p className="field-error">{error}</p>}
        <button className="btn btn-brass btn-block" type="submit" disabled={submitting}>
          {submitting ? "…" : t.auth.resetPasswordSubmit}
        </button>
      </form>
    </>
  );
}
