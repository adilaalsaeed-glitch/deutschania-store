"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { useLocale } from "@/components/LocaleProvider";

type Step = 1 | 2 | 3;

type AccountFields = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  dob: string;
};

type AddressFields = {
  street: string;
  buildingNo: string;
  city: string;
  postal: string;
  mobile: string;
};

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label>{label}</label>
      <div className="pw-wrap">
        <input
          type={show ? "text" : "password"}
          required
          minLength={8}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" className="pw-toggle" onClick={() => setShow((v) => !v)} aria-label="Toggle password visibility">
          👁
        </button>
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const { t } = useLocale();
  const labels = [t.auth.stepAccount, t.auth.stepAddress, t.auth.stepReview];
  return (
    <div className="reg-steps">
      {labels.map((label, i) => {
        const n = (i + 1) as Step;
        const done = n < step;
        const active = n === step;
        return (
          <Fragment key={n}>
            {i > 0 && <div className={`step-line${done ? " done" : ""}`} />}
            <div className={`step-circle${active ? " active" : ""}${done ? " done" : ""}`} title={label}>
              {done ? "✓" : n}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

export default function RegisterPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [account, setAccount] = useState<AccountFields>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    dob: "",
  });
  const [address, setAddress] = useState<AddressFields>({
    street: "",
    buildingNo: "",
    city: "",
    postal: "",
    mobile: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setAccountField<K extends keyof AccountFields>(key: K, value: string) {
    setAccount((a) => ({ ...a, [key]: value }));
  }
  function setAddressField<K extends keyof AddressFields>(key: K, value: string) {
    setAddress((a) => ({ ...a, [key]: value }));
  }

  function submitStep1(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (account.password !== account.confirmPassword) {
      setError(t.auth.passwordMismatch);
      return;
    }
    setStep(2);
  }

  function submitStep2(e: React.FormEvent) {
    e.preventDefault();
    setStep(3);
  }

  async function submitStep3() {
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        password: account.password,
        dateOfBirth: account.dob || undefined,
        address: {
          street: address.street,
          buildingNo: address.buildingNo || undefined,
          city: address.city,
          postal: address.postal,
          mobile: address.mobile,
        },
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(t.errors[data.error as keyof typeof t.errors] ?? t.errors.UNKNOWN);
      setSubmitting(false);
      return;
    }

    const signInRes = await signIn("credentials", { email: account.email, password: account.password, redirect: false });
    setSubmitting(false);
    if (signInRes?.error) {
      router.push("/login");
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
          <StepIndicator step={step} />

          {step === 1 && (
            <>
              <h1 className="auth-title">{t.auth.registerTitle}</h1>
              <p className="auth-sub">{t.auth.registerSubtitle}</p>
              <form className="auth-form" onSubmit={submitStep1}>
                <div className="field-row">
                  <div className="field">
                    <label>{t.auth.firstName}</label>
                    <input required value={account.firstName} onChange={(e) => setAccountField("firstName", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>{t.auth.lastName}</label>
                    <input required value={account.lastName} onChange={(e) => setAccountField("lastName", e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label>{t.auth.email}</label>
                  <input type="email" required value={account.email} onChange={(e) => setAccountField("email", e.target.value)} />
                </div>
                <PasswordField label={t.auth.password} value={account.password} onChange={(v) => setAccountField("password", v)} />
                <PasswordField
                  label={t.auth.confirmPassword}
                  value={account.confirmPassword}
                  onChange={(v) => setAccountField("confirmPassword", v)}
                />
                <div className="field">
                  <label>{t.auth.dob}</label>
                  <input type="date" required value={account.dob} onChange={(e) => setAccountField("dob", e.target.value)} />
                </div>
                {error && <p className="field-error">{error}</p>}
                <button className="btn btn-brass btn-block" type="submit">
                  {t.auth.continue}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="auth-title">{t.auth.addressTitle}</h1>
              <p className="auth-sub">{t.auth.addressSubtitle}</p>
              <form className="auth-form" onSubmit={submitStep2}>
                <div className="field">
                  <label>{t.auth.street}</label>
                  <input required value={address.street} onChange={(e) => setAddressField("street", e.target.value)} />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>{t.auth.buildingNo}</label>
                    <input required value={address.buildingNo} onChange={(e) => setAddressField("buildingNo", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>{t.auth.city}</label>
                    <input required value={address.city} onChange={(e) => setAddressField("city", e.target.value)} />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>{t.auth.postal}</label>
                    <input required value={address.postal} onChange={(e) => setAddressField("postal", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>{t.auth.mobile}</label>
                    <input required type="tel" value={address.mobile} onChange={(e) => setAddressField("mobile", e.target.value)} />
                  </div>
                </div>
                <div className="reg-nav">
                  <button type="button" className="btn btn-ghost-outline" onClick={() => setStep(1)}>
                    {t.auth.back}
                  </button>
                  <button type="submit" className="btn btn-brass">
                    {t.auth.continue}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="auth-title">{t.auth.reviewTitle}</h1>
              <p className="auth-sub">{t.auth.reviewSubtitle}</p>
              <div className="auth-form">
                <table className="review-table">
                  <tbody>
                    <tr>
                      <td>{t.auth.firstName} / {t.auth.lastName}</td>
                      <td>{account.firstName} {account.lastName}</td>
                    </tr>
                    <tr>
                      <td>{t.auth.email}</td>
                      <td>{account.email}</td>
                    </tr>
                    <tr>
                      <td>{t.auth.dob}</td>
                      <td>{account.dob}</td>
                    </tr>
                    <tr>
                      <td>{t.auth.addressTitle}</td>
                      <td>
                        {address.street} {address.buildingNo}, {address.city} {address.postal}
                      </td>
                    </tr>
                    <tr>
                      <td>{t.auth.mobile}</td>
                      <td>{address.mobile}</td>
                    </tr>
                  </tbody>
                </table>
                {error && <p className="field-error">{error}</p>}
                <div className="reg-nav">
                  <button type="button" className="btn btn-ghost-outline" onClick={() => setStep(2)} disabled={submitting}>
                    {t.auth.back}
                  </button>
                  <button type="button" className="btn btn-brass" onClick={submitStep3} disabled={submitting}>
                    {submitting ? "…" : t.auth.confirmCreate}
                  </button>
                </div>
              </div>
            </>
          )}

          <Link href="/login" className="auth-switch-btn" style={{ display: "block", textAlign: "center" }}>
            {t.auth.haveAccount}
          </Link>
        </div>
      </section>
    </SiteChrome>
  );
}
