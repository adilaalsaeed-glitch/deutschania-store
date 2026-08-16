import { formatPriceCents } from "@/lib/currency";
import type { getDictionary, Locale } from "@/i18n/config";

// Purely presentational - no interactivity, so this stays a plain server component (like
// LegalPage) rather than needing "use client" just to read translations.
export function ProductMarginBox({
  t,
  locale,
  priceCents,
  unitCostCents,
  costDate,
}: {
  t: ReturnType<typeof getDictionary>;
  locale: Locale;
  priceCents: number;
  unitCostCents: number | null;
  costDate: Date | null;
}) {
  return (
    <div className="admin-form-section">
      <h2 className="admin-form-section-title">{t.admin.marginTitle}</h2>
      <dl className="legal-fields">
        <div className="legal-field-row">
          <dt>{t.admin.marginSellingPrice}</dt>
          <dd>{formatPriceCents(priceCents, "EUR")}</dd>
        </div>
        <div className="legal-field-row">
          <dt>{t.admin.marginLatestCost}</dt>
          <dd>
            {unitCostCents != null ? (
              <>
                {formatPriceCents(unitCostCents, "EUR")}
                {costDate && (
                  <span style={{ opacity: 0.6, fontSize: "0.8rem" }}>
                    {" "}
                    ({t.admin.marginCostDate.replace("{date}", costDate.toLocaleDateString(locale === "ar" ? "ar-EG" : locale))})
                  </span>
                )}
              </>
            ) : (
              t.admin.costNotRecorded
            )}
          </dd>
        </div>
        {unitCostCents != null && (
          <>
            <div className="legal-field-row">
              <dt>{t.admin.marginAmount}</dt>
              <dd>{formatPriceCents(priceCents - unitCostCents, "EUR")}</dd>
            </div>
            <div className="legal-field-row">
              <dt>{t.admin.marginPercent}</dt>
              <dd>{priceCents > 0 ? (((priceCents - unitCostCents) / priceCents) * 100).toFixed(1) : "0.0"}%</dd>
            </div>
          </>
        )}
      </dl>
      {unitCostCents == null && <p className="admin-empty-note">{t.admin.marginNoCostYet}</p>}
    </div>
  );
}
