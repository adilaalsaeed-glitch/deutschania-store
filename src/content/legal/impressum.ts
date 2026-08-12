import type { LegalContentByLocale } from "@/content/legal/types";
import { PLACEHOLDER } from "@/content/legal/placeholder";

export const impressum: LegalContentByLocale = {
  ar: {
    title: "بيانات الناشر القانونية (Impressum)",
    intro:
      "هذه الصفحة مسودة أولية قيد الإعداد ولا تشكّل حتى الآن البيان القانوني النهائي للموقع. سيتم استكمالها ومراجعتها من قِبل محامٍ مختص قبل الإطلاق الرسمي للموقع للعامة.",
    sections: [
      {
        heading: "بيانات مقدّم الخدمة",
        fields: [
          { label: "اسم الشركة", value: "Deutschania" },
          { label: "العنوان", value: PLACEHOLDER.ar },
          { label: "السجل التجاري", value: PLACEHOLDER.ar },
          { label: "الشخص المخوّل بالتمثيل القانوني", value: PLACEHOLDER.ar },
          { label: "الهاتف", value: PLACEHOLDER.ar },
          { label: "البريد الإلكتروني", value: PLACEHOLDER.ar },
          { label: "الرقم الضريبي (VAT ID)", value: PLACEHOLDER.ar },
        ],
      },
      {
        heading: "المسؤول عن المحتوى",
        body: [
          "المسؤول عن المحتوى وفق الأنظمة ذات العلاقة هو الشخص أو الجهة الممثِّلة لشركة Deutschania، وستُستكمل بياناته هنا فور اكتمال إجراءات الترخيص التجاري.",
        ],
      },
      {
        heading: "إخلاء مسؤولية المحتوى",
        body: [
          "نبذل عناية معقولة للتأكد من دقة المعلومات المنشورة على هذا الموقع، إلا أننا لا نتحمل مسؤولية اكتمالها أو دقتها أو حداثتها بشكل مطلق. كمزوّد خدمة، نتحمل المسؤولية عن المحتوى الخاص بنا وفق الأحكام القانونية العامة.",
        ],
      },
      {
        heading: "إخلاء مسؤولية الروابط",
        body: [
          "قد يحتوي هذا الموقع على روابط لمواقع خارجية لا نملك أي سيطرة على محتواها. لذلك لا يمكننا تحمّل أي مسؤولية عن هذا المحتوى الخارجي. تقع مسؤولية محتوى الصفحات المرتبطة على مزوّدي أو مشغّلي تلك الصفحات وحدهم.",
        ],
      },
      {
        heading: "حقوق النشر",
        body: [
          "المحتوى والأعمال المنشورة على هذا الموقع من إعداد الناشر تخضع لقانون حقوق النشر الألماني. يُحظر أي نسخ أو تعديل أو توزيع أو استخدام تجاري خارج نطاق القانون دون موافقة خطية مسبقة من الناشر.",
        ],
      },
    ],
  },
  de: {
    title: "Impressum",
    intro:
      "Diese Seite ist ein vorläufiger Entwurf in Bearbeitung und stellt derzeit noch keine rechtsverbindliche, finale Anbieterkennzeichnung dar. Sie wird vor dem offiziellen öffentlichen Launch der Website von einem Rechtsanwalt geprüft und vervollständigt.",
    sections: [
      {
        heading: "Anbieterkennzeichnung",
        fields: [
          { label: "Firma", value: "Deutschania" },
          { label: "Anschrift", value: PLACEHOLDER.de },
          { label: "Handelsregister", value: PLACEHOLDER.de },
          { label: "Vertretungsberechtigte Person(en)", value: PLACEHOLDER.de },
          { label: "Telefon", value: PLACEHOLDER.de },
          { label: "E-Mail", value: PLACEHOLDER.de },
          { label: "Umsatzsteuer-Identifikationsnummer", value: PLACEHOLDER.de },
        ],
      },
      {
        heading: "Verantwortlich für den Inhalt gemäß § 18 Abs. 2 MStV",
        body: [
          "Verantwortlich für den Inhalt ist die vertretungsberechtigte Person von Deutschania. Die vollständigen Angaben werden nach Abschluss der Gewerbeanmeldung ergänzt.",
        ],
      },
      {
        heading: "Haftung für Inhalte",
        body: [
          "Wir bemühen uns um die Richtigkeit und Aktualität der auf dieser Website bereitgestellten Informationen, können jedoch keine Gewähr für deren Vollständigkeit und Richtigkeit übernehmen. Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.",
        ],
      },
      {
        heading: "Haftung für Links",
        body: [
          "Unser Angebot kann Links zu externen Websites Dritter enthalten, auf deren Inhalte wir keinen Einfluss haben. Für diese fremden Inhalte können wir daher keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.",
        ],
      },
      {
        heading: "Urheberrecht",
        body: [
          "Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der vorherigen schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.",
        ],
      },
    ],
  },
  en: {
    title: "Legal Notice (Impressum)",
    intro:
      "This page is a preliminary draft still in progress and does not yet constitute the final, legally binding provider identification for this website. It will be completed and reviewed by a qualified lawyer before the site's official public launch.",
    sections: [
      {
        heading: "Provider Information",
        fields: [
          { label: "Company name", value: "Deutschania" },
          { label: "Address", value: PLACEHOLDER.en },
          { label: "Commercial register", value: PLACEHOLDER.en },
          { label: "Authorized representative(s)", value: PLACEHOLDER.en },
          { label: "Phone", value: PLACEHOLDER.en },
          { label: "Email", value: PLACEHOLDER.en },
          { label: "VAT identification number", value: PLACEHOLDER.en },
        ],
      },
      {
        heading: "Responsible for content",
        body: [
          "The person responsible for content is the authorized representative of Deutschania. Full details will be added once the business registration process is complete.",
        ],
      },
      {
        heading: "Disclaimer for content",
        body: [
          "We make reasonable efforts to keep the information on this website accurate and up to date, but we cannot guarantee its completeness or accuracy at all times. As a service provider, we are responsible for our own content on these pages in accordance with general law.",
        ],
      },
      {
        heading: "Disclaimer for links",
        body: [
          "This website may contain links to external third-party websites over whose content we have no control. We therefore cannot accept any liability for this external content. The respective provider or operator of the linked pages is always responsible for their content.",
        ],
      },
      {
        heading: "Copyright",
        body: [
          "Content and works created by the site operator on these pages are subject to applicable copyright law. Duplication, editing, distribution, or any form of commercial use beyond the scope of copyright law requires the prior written consent of the respective author or creator.",
        ],
      },
    ],
  },
};
