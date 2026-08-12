import type { Locale } from "@/i18n/config";

export type LegalField = { label: string; value: string };

export type LegalSection = {
  heading: string;
  body?: string[]; // paragraphs
  fields?: LegalField[]; // label/value rows (used by Impressum's provider details)
};

export type LegalContent = {
  title: string;
  intro?: string;
  sections: LegalSection[];
};

export type LegalContentByLocale = Record<Locale, LegalContent>;
