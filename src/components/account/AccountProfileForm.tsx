"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { CountrySelect, PhoneField } from "@/components/CountryPhoneField";
import { combinePhone, splitPhone, type CountryCode } from "@/data/countries";

async function postJson(url: string, body: unknown, method: "PATCH" | "POST" = "POST") {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function AccountProfileForm({
  firstName: initialFirstName,
  lastName: initialLastName,
  email,
  mobile: initialMobile,
  landline: initialLandline,
  country: initialCountry,
}: {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  landline: string;
  country: CountryCode | "";
}) {
  const { locale, t } = useLocale();
  const errorText = (code: string) => t.errors[code as keyof typeof t.errors] ?? t.errors.UNKNOWN;

  // Personal info section
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [country, setCountry] = useState<CountryCode | "">(initialCountry);
  const [mobile, setMobile] = useState(splitPhone(initialMobile).localNumber);
  const [landline, setLandline] = useState(splitPhone(initialLandline).localNumber);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    const { ok, data } = await postJson(
      "/api/account/profile",
      {
        firstName,
        lastName,
        country,
        mobile: combinePhone(country, mobile),
        landline: landline ? combinePhone(country, landline) : undefined,
      },
      "PATCH"
    );
    setProfileSaving(false);
    setProfileMsg(ok ? { ok: true, text: t.account.profile.saved } : { ok: false, text: errorText(data.error) });
  }

  // Email change section
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function requestEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailSaving(true);
    setEmailMsg(null);
    const { ok, data } = await postJson("/api/account/email", { newEmail, currentPassword: emailPassword, lang: locale });
    setEmailSaving(false);
    if (ok) {
      setEmailMsg({ ok: true, text: t.account.profile.emailChangeSent });
      setNewEmail("");
      setEmailPassword("");
      setChangingEmail(false);
    } else {
      setEmailMsg({ ok: false, text: errorText(data.error) });
    }
  }

  // Password change section
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ ok: false, text: t.auth.passwordMismatch });
      return;
    }
    setPasswordSaving(true);
    const { ok, data } = await postJson("/api/account/password", { currentPassword, newPassword });
    setPasswordSaving(false);
    if (ok) {
      setPasswordMsg({ ok: true, text: t.account.profile.passwordChanged });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } else {
      setPasswordMsg({ ok: false, text: errorText(data.error) });
    }
  }

  return (
    <div className="account-dashboard">
      <h1 className="auth-title">{t.account.sidebar.profile}</h1>

      <form className="account-card" onSubmit={saveProfile}>
        <h2 className="account-card-title">{t.account.profile.personalInfo}</h2>
        <div className="field-row">
          <div className="field">
            <label>{t.auth.firstName}</label>
            <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="field">
            <label>{t.auth.lastName}</label>
            <input required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>{t.auth.country}</label>
          <CountrySelect required value={country} onChange={setCountry} />
        </div>
        <div className="field">
          <label>{t.auth.mobile}</label>
          <PhoneField required country={country} localNumber={mobile} onLocalNumberChange={setMobile} />
        </div>
        <div className="field">
          <label>{t.auth.landline}</label>
          <PhoneField country={country} localNumber={landline} onLocalNumberChange={setLandline} />
        </div>
        {profileMsg && <p className={profileMsg.ok ? "form-note" : "field-error"}>{profileMsg.text}</p>}
        <button className="btn btn-brass" type="submit" disabled={profileSaving}>
          {profileSaving ? "…" : t.account.profile.saveChanges}
        </button>
      </form>

      <div className="account-card">
        <h2 className="account-card-title">{t.account.profile.currentEmail}</h2>
        <p dir="ltr" style={{ textAlign: "start" }}>
          {email}
        </p>
        {!changingEmail ? (
          <button type="button" className="btn btn-ghost-outline" onClick={() => setChangingEmail(true)}>
            {t.account.profile.changeEmail}
          </button>
        ) : (
          <form onSubmit={requestEmailChange}>
            <p className="form-note">{t.account.profile.emailChangeNotice}</p>
            <div className="field">
              <label>{t.account.profile.newEmail}</label>
              <input required type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>{t.account.profile.currentPassword}</label>
              <input required type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} />
            </div>
            {emailMsg && <p className={emailMsg.ok ? "form-note" : "field-error"}>{emailMsg.text}</p>}
            <div className="reg-nav">
              <button type="button" className="btn btn-ghost-outline" onClick={() => setChangingEmail(false)}>
                {t.auth.back}
              </button>
              <button className="btn btn-brass" type="submit" disabled={emailSaving}>
                {emailSaving ? "…" : t.account.profile.sendConfirmationLink}
              </button>
            </div>
          </form>
        )}
        {emailMsg && !changingEmail && <p className={emailMsg.ok ? "form-note" : "field-error"}>{emailMsg.text}</p>}
      </div>

      <form className="account-card" onSubmit={changePassword}>
        <h2 className="account-card-title">{t.account.profile.changePassword}</h2>
        <div className="field">
          <label>{t.account.profile.currentPassword}</label>
          <input required type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="field">
          <label>{t.account.profile.newPassword}</label>
          <input required type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="field">
          <label>{t.account.profile.confirmNewPassword}</label>
          <input
            required
            type="password"
            minLength={8}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
        </div>
        {passwordMsg && <p className={passwordMsg.ok ? "form-note" : "field-error"}>{passwordMsg.text}</p>}
        <button className="btn btn-brass" type="submit" disabled={passwordSaving}>
          {passwordSaving ? "…" : t.account.profile.changePassword}
        </button>
      </form>
    </div>
  );
}
