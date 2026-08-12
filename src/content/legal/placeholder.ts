import type { Locale } from "@/i18n/config";

// Used for Impressum fields (registered address, commercial register, VAT ID, ...) that can't
// be filled in until the company's business registration is complete.
export const PLACEHOLDER: Record<Locale, string> = {
  ar: "قيد الاستكمال",
  de: "Wird noch ergänzt",
  en: "To be completed",
};
