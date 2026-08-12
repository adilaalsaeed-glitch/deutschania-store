import type { LegalContentByLocale } from "@/content/legal/types";
import { PLACEHOLDER } from "@/content/legal/placeholder";

export const datenschutz: LegalContentByLocale = {
  ar: {
    title: "سياسة الخصوصية (Datenschutz)",
    intro:
      "هذه مسودة أولية عامة لسياسة الخصوصية، مُعدّة لمرحلة الإعداد المبدئي فقط. ستُراجع من قِبل مختص قانوني وتُستكمل ببيانات جهة التواصل الرسمية قبل إتاحة الموقع للعامة.",
    sections: [
      {
        heading: "1. الجهة المسؤولة عن معالجة البيانات",
        body: [
          `الجهة المسؤولة عن معالجة بياناتك الشخصية عند استخدام هذا الموقع هي شركة Deutschania. بيانات التواصل الكاملة الخاصة بالجهة المسؤولة موضحة في صفحة "بيانات الناشر القانونية" وستُستكمل هناك.`,
        ],
      },
      {
        heading: "2. البيانات التي نجمعها",
        body: [
          "عند إنشاء حساب أو إتمام طلب شراء، نجمع البيانات اللازمة لذلك فقط: الاسم، البريد الإلكتروني، رقم الجوال، عنوان الشحن، وتفاصيل الطلب. لا نقوم بجمع بيانات بطاقة الدفع نفسها؛ تتم معالجتها مباشرة عبر مزوّد خدمة الدفع.",
        ],
      },
      {
        heading: "3. مشاركة البيانات مع أطراف ثالثة",
        body: [
          "نستعين بمزودي خدمات موثوقين لتشغيل الموقع، ولا نشارك بياناتك إلا بالقدر اللازم لتقديم الخدمة: مزوّد بوابة الدفع الإلكتروني لمعالجة المدفوعات، مزوّد خدمة البريد الإلكتروني لإرسال رسائل تأكيد الحساب والطلبات، ومزوّد الاستضافة السحابية لتشغيل الموقع وقاعدة بياناته. لا تُستخدم بياناتك لأغراض إعلانية أو تُباع لأي طرف ثالث.",
        ],
      },
      {
        heading: "4. ملفات تعريف الارتباط (الكوكيز)",
        body: [
          "يستخدم الموقع عددًا محدودًا من ملفات تعريف الارتباط الضرورية لتشغيله بشكل صحيح فقط (مثل تفضيل اللغة وجلسة تسجيل الدخول وسلة التسوق للزوار). لمزيد من التفاصيل، راجع صفحة إعدادات البيانات.",
        ],
      },
      {
        heading: "5. حقوقك",
        body: [
          "يحق لك، وفق الأنظمة المعمول بها، طلب الاطلاع على بياناتك الشخصية المخزنة لدينا، أو تصحيحها، أو حذفها، أو تقييد معالجتها، أو الاعتراض عليها، أو طلب نقلها. يمكنك أيضًا سحب أي موافقة سبق منحها بأثر مستقبلي دون التأثير على شرعية المعالجة التي تمت قبل السحب.",
        ],
      },
      {
        heading: "6. مدة الاحتفاظ بالبيانات",
        body: [
          "نحتفظ ببياناتك الشخصية طالما كان ذلك ضروريًا لتقديم خدماتنا أو للوفاء بالتزامات قانونية أو تعاقدية، ثم يتم حذفها أو إخفاء هويتها بشكل آمن.",
        ],
      },
      {
        heading: "7. التواصل بخصوص الخصوصية",
        body: [`لأي استفسار متعلق بحماية البيانات، يمكن التواصل عبر بيانات الاتصال (${PLACEHOLDER.ar}).`],
      },
    ],
  },
  de: {
    title: "Datenschutzerklärung",
    intro:
      "Dies ist ein allgemeiner, vorläufiger Entwurf der Datenschutzerklärung für die frühe Aufbauphase. Er wird vor der öffentlichen Verfügbarkeit der Website juristisch geprüft und um die vollständigen Kontaktdaten des Verantwortlichen ergänzt.",
    sections: [
      {
        heading: "1. Verantwortlicher",
        body: [
          'Verantwortlich für die Verarbeitung Ihrer personenbezogenen Daten bei der Nutzung dieser Website ist Deutschania. Die vollständigen Kontaktdaten des Verantwortlichen finden Sie im "Impressum" und werden dort vervollständigt.',
        ],
      },
      {
        heading: "2. Welche Daten wir erheben",
        body: [
          "Bei der Erstellung eines Kontos oder dem Abschluss einer Bestellung erheben wir nur die dafür erforderlichen Daten: Name, E-Mail-Adresse, Mobiltelefonnummer, Lieferadresse und Bestelldetails. Zahlungskartendaten selbst erheben wir nicht; diese werden direkt vom Zahlungsdienstleister verarbeitet.",
        ],
      },
      {
        heading: "3. Weitergabe von Daten an Dritte",
        body: [
          "Wir setzen vertrauenswürdige Dienstleister zum Betrieb der Website ein und geben Ihre Daten nur im dafür erforderlichen Umfang weiter: einen Zahlungsdienstleister zur Zahlungsabwicklung, einen E-Mail-Dienstleister für Konto- und Bestellbestätigungen sowie einen Cloud-Hosting-Anbieter für den Betrieb der Website und Datenbank. Ihre Daten werden nicht zu Werbezwecken genutzt oder an Dritte verkauft.",
        ],
      },
      {
        heading: "4. Cookies",
        body: [
          "Diese Website verwendet ausschließlich eine begrenzte Anzahl technisch notwendiger Cookies für den ordnungsgemäßen Betrieb (z. B. Spracheinstellung, Login-Session, Warenkorb für Gäste). Weitere Details finden Sie auf der Seite Dateneinstellungen.",
        ],
      },
      {
        heading: "5. Ihre Rechte",
        body: [
          "Sie haben im Rahmen der geltenden Vorschriften das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Widerspruch sowie Datenübertragbarkeit hinsichtlich Ihrer bei uns gespeicherten personenbezogenen Daten. Eine erteilte Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen, ohne dass die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung berührt wird.",
        ],
      },
      {
        heading: "6. Speicherdauer",
        body: [
          "Wir speichern Ihre personenbezogenen Daten nur so lange, wie dies zur Erbringung unserer Leistungen oder zur Erfüllung gesetzlicher bzw. vertraglicher Pflichten erforderlich ist, und löschen oder anonymisieren sie anschließend sicher.",
        ],
      },
      {
        heading: "7. Kontakt in Datenschutzfragen",
        body: [`Für Fragen zum Datenschutz wenden Sie sich bitte an die Kontaktdaten (${PLACEHOLDER.de}).`],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    intro:
      "This is a general, preliminary draft privacy policy for the early setup phase. It will be legally reviewed and completed with the controller's full contact details before the website becomes publicly available.",
    sections: [
      {
        heading: "1. Data controller",
        body: [
          'The controller responsible for processing your personal data when using this website is Deutschania. The controller\'s full contact details are listed on the "Legal Notice" page and will be completed there.',
        ],
      },
      {
        heading: "2. Data we collect",
        body: [
          "When creating an account or placing an order, we only collect the data necessary for that purpose: name, email address, mobile number, shipping address, and order details. We do not collect payment card data ourselves; it is processed directly by our payment service provider.",
        ],
      },
      {
        heading: "3. Sharing data with third parties",
        body: [
          "We rely on trusted service providers to operate the website and only share your data to the extent necessary: a payment gateway provider to process payments, an email delivery provider to send account and order confirmations, and a cloud hosting provider to run the website and its database. Your data is not used for advertising purposes or sold to any third party.",
        ],
      },
      {
        heading: "4. Cookies",
        body: [
          "This website uses only a limited number of strictly necessary cookies required for it to function correctly (e.g. language preference, login session, guest shopping cart). See the Cookie Settings page for details.",
        ],
      },
      {
        heading: "5. Your rights",
        body: [
          "Under applicable law, you have the right to access, correct, delete, restrict the processing of, object to, and request portability of your personal data held by us. You may also withdraw any previously given consent at any time with future effect, without affecting the lawfulness of processing carried out before the withdrawal.",
        ],
      },
      {
        heading: "6. Data retention",
        body: [
          "We retain your personal data only for as long as necessary to provide our services or to comply with legal or contractual obligations, after which it is securely deleted or anonymized.",
        ],
      },
      {
        heading: "7. Contact for privacy inquiries",
        body: [`For any data protection inquiries, please use the contact details (${PLACEHOLDER.en}).`],
      },
    ],
  },
};
