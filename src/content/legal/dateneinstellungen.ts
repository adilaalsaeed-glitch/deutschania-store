import type { LegalContentByLocale } from "@/content/legal/types";

// Unlike the other three pages, this one describes cookies actually in use today rather than
// generic boilerplate — there are no marketing/analytics cookies in the codebase yet, so there's
// nothing to offer a real consent toggle for. See the closing section for what happens once
// that changes.
export const dateneinstellungen: LegalContentByLocale = {
  ar: {
    title: "إعدادات البيانات (Dateneinstellungen)",
    intro:
      "توضح هذه الصفحة ملفات تعريف الارتباط (الكوكيز) المستخدمة فعليًا في الموقع حاليًا. هذا محتوى أولي سيتم تحديثه مع أي تغيير فعلي في الكوكيز المستخدمة.",
    sections: [
      {
        heading: "الكوكيز الضرورية المستخدمة حاليًا",
        body: [
          "هذه الكوكيز ضرورية لتشغيل الموقع بشكل صحيح ولا يمكن إيقافها، لأنها لا تتعلق بالتسويق أو التتبع بل بوظائف أساسية للموقع نفسه:",
        ],
        fields: [
          { label: "تفضيل اللغة", value: "تحفظ اللغة التي اخترتها لعرض الموقع بها." },
          { label: "جلسة تسجيل الدخول", value: "تحافظ على تسجيل دخولك بأمان أثناء تصفحك للموقع." },
          { label: "رمز الحماية (CSRF)", value: "يحمي نماذج تسجيل الدخول والتسجيل من هجمات التزوير." },
          { label: "سلة تسوق الزوار", value: "تربط سلة تسوقك بجهازك إذا كنت تتسوق دون تسجيل دخول." },
        ],
      },
      {
        heading: "كوكيز التسويق والتحليلات",
        body: [
          "لا يستخدم الموقع حاليًا أي كوكيز تسويقية أو تحليلية أو كوكيز تتبع من أطراف ثالثة (مثل أدوات التحليل الإعلانية).",
        ],
      },
      {
        heading: "خيارات التحكم",
        body: [
          "لا يستخدم الموقع حاليًا أي كوكيز تسويقية أو تحليلية فعليًا، لكن الأداة أدناه جاهزة لإدارة موافقتك عليها بشكل صريح فور إضافتها - يمكنك ضبط تفضيلاتك في أي وقت، ولن يتم تفعيل أي أداة تتبع أو تحليلات قبل موافقتك الصريحة.",
        ],
      },
    ],
  },
  de: {
    title: "Dateneinstellungen",
    intro:
      "Diese Seite beschreibt die derzeit tatsächlich auf der Website verwendeten Cookies. Es handelt sich um einen vorläufigen Inhalt, der bei jeder tatsächlichen Änderung der eingesetzten Cookies aktualisiert wird.",
    sections: [
      {
        heading: "Derzeit verwendete notwendige Cookies",
        body: [
          "Diese Cookies sind für den ordnungsgemäßen Betrieb der Website erforderlich und können nicht deaktiviert werden, da sie keine Werbe- oder Tracking-Zwecke verfolgen, sondern grundlegende Funktionen der Website selbst betreffen:",
        ],
        fields: [
          { label: "Spracheinstellung", value: "Speichert die von Ihnen gewählte Anzeigesprache." },
          { label: "Login-Session", value: "Hält Ihre Anmeldung während des Besuchs sicher aufrecht." },
          { label: "Schutz-Token (CSRF)", value: "Schützt Login- und Registrierungsformulare vor Fälschungsangriffen." },
          { label: "Gäste-Warenkorb", value: "Verknüpft Ihren Warenkorb mit Ihrem Gerät, wenn Sie ohne Login einkaufen." },
        ],
      },
      {
        heading: "Marketing- und Analyse-Cookies",
        body: [
          "Die Website verwendet derzeit keine Marketing-, Analyse- oder Tracking-Cookies von Drittanbietern (z. B. Werbe-Analysetools).",
        ],
      },
      {
        heading: "Steuerungsoptionen",
        body: [
          "Die Website verwendet derzeit keine Marketing- oder Analyse-Cookies aktiv, aber das folgende Werkzeug ist bereit, Ihre ausdrückliche Einwilligung zu verwalten, sobald welche eingeführt werden - Sie können Ihre Einstellungen jederzeit anpassen, und kein Tracking- oder Analysetool wird ohne Ihre ausdrückliche Zustimmung aktiviert.",
        ],
      },
    ],
  },
  en: {
    title: "Cookie Settings (Dateneinstellungen)",
    intro:
      "This page describes the cookies actually in use on the website today. This is preliminary content that will be updated whenever the cookies actually used change.",
    sections: [
      {
        heading: "Necessary cookies currently in use",
        body: [
          "These cookies are required for the website to function correctly and cannot be turned off, as they don't relate to marketing or tracking but to core functionality of the site itself:",
        ],
        fields: [
          { label: "Language preference", value: "Remembers the display language you selected." },
          { label: "Login session", value: "Keeps you securely signed in while browsing the site." },
          { label: "Security token (CSRF)", value: "Protects the login and registration forms from forgery attacks." },
          { label: "Guest shopping cart", value: "Links your cart to your device when shopping without an account." },
        ],
      },
      {
        heading: "Marketing and analytics cookies",
        body: [
          "The website currently does not use any marketing, analytics, or third-party tracking cookies (such as advertising analytics tools).",
        ],
      },
      {
        heading: "Control options",
        body: [
          "The website doesn't actively use any marketing or analytics cookies today, but the tool below is ready to manage your explicit consent as soon as any are introduced - you can adjust your preferences at any time, and no tracking or analytics tool will be activated without your explicit consent.",
        ],
      },
    ],
  },
};
