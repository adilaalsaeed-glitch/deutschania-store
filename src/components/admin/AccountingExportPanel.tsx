"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import type { PeriodType } from "@/lib/accountingPeriod";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const QUARTERS = [1, 2, 3, 4];

export function AccountingExportPanel() {
  const { t, locale } = useLocale();
  const [year, setYear] = useState(currentYear);
  const [type, setType] = useState<PeriodType>("month");
  const [value, setValue] = useState(new Date().getMonth() + 1);

  function changeType(next: PeriodType) {
    setType(next);
    setValue(1);
  }

  const monthName = (m: number) =>
    new Date(2000, m - 1, 1).toLocaleDateString(locale === "ar" ? "ar-EG" : locale, { month: "long" });

  const query = `year=${year}&type=${type}&value=${value}`;

  return (
    <div className="accounting-export-panel">
      <p className="auth-sub">{t.admin.accountingSubtitle}</p>
      <div className="field-row">
        <div className="field">
          <label>{t.admin.accountingYear}</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t.admin.accountingPeriodType}</label>
          <select value={type} onChange={(e) => changeType(e.target.value as PeriodType)}>
            <option value="month">{t.admin.accountingMonth}</option>
            <option value="quarter">{t.admin.accountingQuarter}</option>
            <option value="year">{t.admin.accountingFullYear}</option>
          </select>
        </div>
        {type !== "year" && (
          <div className="field">
            <label>{type === "month" ? t.admin.accountingMonth : t.admin.accountingQuarter}</label>
            <select value={value} onChange={(e) => setValue(Number(e.target.value))}>
              {(type === "month" ? MONTHS : QUARTERS).map((v) => (
                <option key={v} value={v}>
                  {type === "month" ? monthName(v) : `Q${v}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="admin-row-actions" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <a href={`/api/admin/accounting/export-csv?${query}`} className="btn btn-brass">
          {t.admin.accountingExportCsv}
        </a>
        <a href={`/api/admin/accounting/export-zip?${query}`} className="btn btn-ghost-outline">
          {t.admin.accountingExportZip}
        </a>
      </div>
    </div>
  );
}
