"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AsYouType, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { useLocale } from "@/components/LocaleProvider";
import { DEFAULT_COUNTRY_ISO2, flagClass, getCountryByIso2, getSortedCountries } from "@/lib/countries";

function toE164(iso2: CountryCode, nationalDigits: string, dialCode: string): string {
  if (!nationalDigits) return "";
  const parsed = parsePhoneNumberFromString(nationalDigits, iso2);
  if (parsed) return parsed.number;
  return `+${dialCode}${nationalDigits}`;
}

export function PhoneInput({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e164: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const { locale, t } = useLocale();
  const countries = useMemo(() => getSortedCountries(locale), [locale]);

  // Seed local state from an incoming E.164 value on first render only (e.g. editing a
  // saved profile) - React's lazy useState initializer runs exactly once per mount.
  const [iso2, setIso2] = useState<CountryCode>(() => {
    const parsed = value ? parsePhoneNumberFromString(value) : undefined;
    return parsed?.country ?? DEFAULT_COUNTRY_ISO2;
  });
  const [national, setNational] = useState(() => {
    const parsed = value ? parsePhoneNumberFromString(value) : undefined;
    return parsed?.nationalNumber ?? "";
  });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const selected = getCountryByIso2(iso2) ?? countries[0];

  const filtered = query.trim()
    ? countries.filter((c) => c.name[locale].toLowerCase().includes(query.trim().toLowerCase()) || c.dialCode.includes(query.trim()))
    : countries;

  const displayNumber = useMemo(() => {
    if (!national) return "";
    const ayt = new AsYouType(iso2);
    return ayt.input(national);
  }, [iso2, national]);

  function selectCountry(newIso2: CountryCode) {
    setIso2(newIso2);
    setOpen(false);
    setQuery("");
    const dialCode = getCountryByIso2(newIso2)?.dialCode ?? selected.dialCode;
    onChange(toE164(newIso2, national, dialCode));
  }

  function handleNationalChange(raw: string) {
    const digits = raw.replace(/\D/g, "");
    setNational(digits);
    onChange(toE164(iso2, digits, selected.dialCode));
  }

  return (
    <div className="field">
      <label>{label}</label>
      <div className="phone-input" ref={rootRef}>
        <button
          type="button"
          className="phone-input-country"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className={`${flagClass(selected.iso2)} phone-input-flag`} />
          <span className="phone-input-dial">+{selected.dialCode}</span>
          <span className="phone-input-caret">▾</span>
        </button>
        <input
          type="tel"
          required={required}
          className="phone-input-number"
          value={displayNumber}
          onChange={(e) => handleNationalChange(e.target.value)}
          placeholder={placeholder ?? t.auth.mobilePlaceholder}
        />

        {open && (
          <div className="phone-dropdown">
            <input
              ref={searchRef}
              type="text"
              className="phone-dropdown-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.auth.countrySearch}
            />
            <ul className="phone-dropdown-list">
              {filtered.map((c) => (
                <li key={c.iso2}>
                  <button type="button" className="phone-dropdown-item" onClick={() => selectCountry(c.iso2)}>
                    <span className={`${flagClass(c.iso2)} phone-input-flag`} />
                    <span className="phone-dropdown-name">{c.name[locale]}</span>
                    <span className="phone-dropdown-dial">+{c.dialCode}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && <li className="phone-dropdown-empty">{t.auth.countryNoResults}</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
