import ar from "./ar.json";
import de from "./de.json";
import en from "./en.json";

export const locales = ["ar", "de", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";
export const rtlLocales: Locale[] = ["ar"];

const dictionaries: Record<Locale, typeof en> = { ar, de, en };

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export function dir(locale: Locale): "rtl" | "ltr" {
  return rtlLocales.includes(locale) ? "rtl" : "ltr";
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
