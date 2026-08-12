"use client";

import { useLocale } from "@/components/LocaleProvider";
import { SUPPORTED_COUNTRIES, dialCodeFor, type CountryCode } from "@/data/countries";

export function CountrySelect({
  value,
  onChange,
  required,
}: {
  value: CountryCode | "";
  onChange: (v: CountryCode) => void;
  required?: boolean;
}) {
  const { locale, t } = useLocale();
  return (
    <select required={required} value={value} onChange={(e) => onChange(e.target.value as CountryCode)}>
      <option value="" disabled>
        {t.auth.selectCountry}
      </option>
      {SUPPORTED_COUNTRIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.flag} {c.name[locale]}
        </option>
      ))}
    </select>
  );
}

export function PhoneField({
  country,
  localNumber,
  onLocalNumberChange,
  required,
}: {
  country: CountryCode | "";
  localNumber: string;
  onLocalNumberChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="phone-field-row">
      <span className="phone-dial-code">{dialCodeFor(country) || "+…"}</span>
      <input
        type="tel"
        required={required}
        value={localNumber}
        onChange={(e) => onLocalNumberChange(e.target.value)}
      />
    </div>
  );
}
