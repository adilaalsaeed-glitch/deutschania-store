"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { ImageUpload } from "@/components/admin/ImageUpload";
import type { Locale } from "@/i18n/config";
import type { AttrRow, I18nText } from "@/types/product";

type CategoryOption = { key: string; label: I18nText };

type ProductFormData = {
  slug: string;
  brand: string;
  name: I18nText;
  description: I18nText;
  priceCents: number;
  stockQuantity: number;
  imageUrl: string | null;
  origin: "de" | "ar";
  categoryKey: string;
  featured: boolean;
  attributes: Record<Locale, AttrRow[]>;
  domesticTaxRatePercent: 19 | 7 | null;
};

const emptyI18n: I18nText = { ar: "", de: "", en: "" };
const emptyAttrs: Record<Locale, AttrRow[]> = { ar: [], de: [], en: [] };

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="admin-form-section">
      <h2 className="admin-form-section-title">{title}</h2>
      {children}
    </div>
  );
}

export function ProductForm({
  mode,
  productId,
  categories,
  initial,
}: {
  mode: "create" | "edit";
  productId?: string;
  categories: CategoryOption[];
  initial?: ProductFormData;
}) {
  const { locale, t } = useLocale();
  const router = useRouter();

  const [data, setData] = useState<ProductFormData>(
    initial ?? {
      slug: "",
      brand: "",
      name: emptyI18n,
      description: emptyI18n,
      priceCents: 0,
      stockQuantity: 0,
      imageUrl: null,
      origin: "de",
      categoryKey: categories[0]?.key ?? "",
      featured: false,
      attributes: emptyAttrs,
      domesticTaxRatePercent: null,
    }
  );
  const [priceInput, setPriceInput] = useState((data.priceCents / 100).toFixed(2));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function updateAttr(lang: Locale, index: number, field: "label" | "value", value: string) {
    setData((d) => ({
      ...d,
      attributes: {
        ...d.attributes,
        [lang]: d.attributes[lang].map((row, i) => (i === index ? { ...row, [field]: value } : row)),
      },
    }));
  }

  function addAttr(lang: Locale) {
    setData((d) => ({ ...d, attributes: { ...d.attributes, [lang]: [...d.attributes[lang], { label: "", value: "" }] } }));
  }

  function removeAttr(lang: Locale, index: number) {
    setData((d) => ({ ...d, attributes: { ...d.attributes, [lang]: d.attributes[lang].filter((_, i) => i !== index) } }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const priceCents = Math.round(Number(priceInput) * 100);
    const attributes = {
      ar: data.attributes.ar.filter((r) => r.label.trim() && r.value.trim()),
      de: data.attributes.de.filter((r) => r.label.trim() && r.value.trim()),
      en: data.attributes.en.filter((r) => r.label.trim() && r.value.trim()),
    };

    const payload = { ...data, priceCents, attributes };
    const url = mode === "create" ? "/api/admin/products" : `/api/admin/products/${productId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (!res.ok) {
      const resData = await res.json().catch(() => ({}));
      setError(t.errors[resData.error as keyof typeof t.errors] ?? t.errors.UNKNOWN);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <FormSection title={t.admin.sectionBasicInfo}>
        <div className="field">
          <label>{t.admin.brand}</label>
          <input required value={data.brand} onChange={(e) => update("brand", e.target.value)} />
        </div>

        <div className="field">
          <label>{t.admin.slug}</label>
          <input
            required
            dir="ltr"
            pattern="[a-z0-9-]+"
            value={data.slug}
            onChange={(e) => update("slug", e.target.value)}
          />
          <p className="form-note">{t.admin.slugHint}</p>
        </div>

        <div className="field">
          <label>{t.admin.nameAr}</label>
          <input required value={data.name.ar} onChange={(e) => update("name", { ...data.name, ar: e.target.value })} />
        </div>
        <div className="field">
          <label>{t.admin.nameDe}</label>
          <input required value={data.name.de} onChange={(e) => update("name", { ...data.name, de: e.target.value })} />
        </div>
        <div className="field">
          <label>{t.admin.nameEn}</label>
          <input required value={data.name.en} onChange={(e) => update("name", { ...data.name, en: e.target.value })} />
        </div>

        <div className="field-row">
          <div className="field">
            <label>{t.admin.category}</label>
            <select required value={data.categoryKey} onChange={(e) => update("categoryKey", e.target.value)}>
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label[locale]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t.admin.origin}</label>
            <select value={data.origin} onChange={(e) => update("origin", e.target.value as "de" | "ar")}>
              <option value="de">{t.admin.originDe}</option>
              <option value="ar">{t.admin.originAr}</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>{t.admin.domesticTaxRate}</label>
          <select
            value={data.domesticTaxRatePercent === null ? "" : String(data.domesticTaxRatePercent)}
            onChange={(e) => update("domesticTaxRatePercent", e.target.value === "" ? null : (Number(e.target.value) as 19 | 7))}
          >
            <option value="">{t.admin.domesticTaxRateUndetermined}</option>
            <option value="19">19%</option>
            <option value="7">7%</option>
          </select>
          <p className="form-note">{t.admin.domesticTaxRateHint}</p>
        </div>

        <div className="field">
          <label className="admin-checkbox-label">
            <input type="checkbox" checked={data.featured} onChange={(e) => update("featured", e.target.checked)} />
            {t.admin.featured}
          </label>
        </div>
      </FormSection>

      <FormSection title={t.admin.sectionDescription}>
        <div className="field">
          <label>{t.admin.descriptionAr}</label>
          <textarea value={data.description.ar} onChange={(e) => update("description", { ...data.description, ar: e.target.value })} />
        </div>
        <div className="field">
          <label>{t.admin.descriptionDe}</label>
          <textarea value={data.description.de} onChange={(e) => update("description", { ...data.description, de: e.target.value })} />
        </div>
        <div className="field">
          <label>{t.admin.descriptionEn}</label>
          <textarea value={data.description.en} onChange={(e) => update("description", { ...data.description, en: e.target.value })} />
        </div>

        <div className="field">
          <label>{t.admin.attributes}</label>
          <p className="form-note">{t.admin.attributesHint}</p>
          {(["ar", "de", "en"] as const).map((lang) => (
            <div className="admin-attr-lang" key={lang}>
              <span className="admin-attr-lang-label">{t.admin.langLabel[lang]}</span>
              {data.attributes[lang].map((row, i) => (
                <div className="admin-attr-row" key={i}>
                  <input placeholder={t.admin.attributeLabel} value={row.label} onChange={(e) => updateAttr(lang, i, "label", e.target.value)} />
                  <input placeholder={t.admin.attributeValue} value={row.value} onChange={(e) => updateAttr(lang, i, "value", e.target.value)} />
                  <button type="button" className="admin-attr-remove" onClick={() => removeAttr(lang, i)} aria-label={t.admin.removeAttribute}>
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-ghost-outline admin-add-attr-btn" onClick={() => addAttr(lang)}>
                + {t.admin.addAttribute}
              </button>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection title={t.admin.sectionPricing}>
        <div className="field-row">
          <div className="field">
            <label>{t.admin.price}</label>
            <input required type="number" step="0.01" min="0" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} />
          </div>
          <div className="field">
            <label>{t.admin.stockQuantity}</label>
            <input
              required
              type="number"
              step="1"
              min="0"
              value={data.stockQuantity}
              onChange={(e) => update("stockQuantity", Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
        </div>
        <p className="form-note">{t.admin.stockQuantityHint}</p>
      </FormSection>

      <FormSection title={t.admin.sectionImages}>
        <ImageUpload value={data.imageUrl} onChange={(url) => update("imageUrl", url)} />
      </FormSection>

      {error && <p className="field-error">{error}</p>}

      <button className="btn btn-brass" type="submit" disabled={submitting}>
        {submitting ? (mode === "create" ? t.admin.creating : t.admin.saving) : mode === "create" ? t.admin.create : t.admin.save}
      </button>
    </form>
  );
}
