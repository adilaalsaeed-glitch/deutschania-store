import { Resend } from "resend";

const FROM = "deutschania <noreply@deutschania.com>";

let resendClient: Resend | null = null;
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set.");
  }
  resendClient ??= new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

const copy = {
  ar: {
    subject: "تأكيد بريدك الإلكتروني - Deutschania",
    heading: "مرحبًا بك في Deutschania",
    body: "الرجاء تأكيد بريدك الإلكتروني لإكمال إنشاء حسابك",
    button: "تفعيل الحساب",
    expires: "هذا الرابط صالح لمدة 24 ساعة",
    footer: "Deutschania - متجر المنتجات الألمانية",
  },
  de: {
    subject: "Bestätigen Sie Ihre E-Mail-Adresse - Deutschania",
    heading: "Willkommen bei Deutschania",
    body: "Bitte bestätigen Sie Ihre E-Mail-Adresse, um die Erstellung Ihres Kontos abzuschließen",
    button: "Konto aktivieren",
    expires: "Dieser Link ist 24 Stunden gültig",
    footer: "Deutschania - Ihr Shop für deutsche Produkte",
  },
  en: {
    subject: "Confirm your email - Deutschania",
    heading: "Welcome to Deutschania",
    body: "Please confirm your email to complete creating your account",
    button: "Activate account",
    expires: "This link is valid for 24 hours",
    footer: "Deutschania - German products store",
  },
} as const;

const emailChangeCopy = {
  ar: {
    subject: "تأكيد بريدك الإلكتروني الجديد - Deutschania",
    heading: "تأكيد البريد الإلكتروني الجديد",
    body: "طلبت تغيير البريد الإلكتروني لحسابك بـ Deutschania. اضغط الزر بالأسفل لتأكيد هذا البريد الجديد",
    button: "تأكيد البريد الجديد",
    expires: "هذا الرابط صالح لمدة 24 ساعة",
    footer: "Deutschania - متجر المنتجات الألمانية",
  },
  de: {
    subject: "Bestätigen Sie Ihre neue E-Mail-Adresse - Deutschania",
    heading: "Neue E-Mail-Adresse bestätigen",
    body: "Sie haben eine Änderung der E-Mail-Adresse für Ihr Deutschania-Konto angefordert. Klicken Sie unten, um diese neue Adresse zu bestätigen",
    button: "Neue E-Mail bestätigen",
    expires: "Dieser Link ist 24 Stunden gültig",
    footer: "Deutschania - Ihr Shop für deutsche Produkte",
  },
  en: {
    subject: "Confirm your new email - Deutschania",
    heading: "Confirm your new email",
    body: "You requested to change the email address on your Deutschania account. Click below to confirm this new address",
    button: "Confirm new email",
    expires: "This link is valid for 24 hours",
    footer: "Deutschania - German products store",
  },
} as const;

const passwordResetCopy = {
  ar: {
    subject: "إعادة تعيين كلمة المرور - Deutschania",
    heading: "إعادة تعيين كلمة المرور",
    body: "طلبت إعادة تعيين كلمة المرور لحسابك بـ Deutschania. اضغط الزر بالأسفل لاختيار كلمة مرور جديدة. لو ما طلبت هذا، تجاهل الرسالة",
    button: "إعادة تعيين كلمة المرور",
    expires: "هذا الرابط صالح لمدة ساعة واحدة",
    footer: "Deutschania - متجر المنتجات الألمانية",
  },
  de: {
    subject: "Passwort zurücksetzen - Deutschania",
    heading: "Passwort zurücksetzen",
    body: "Sie haben angefordert, das Passwort für Ihr Deutschania-Konto zurückzusetzen. Klicken Sie unten, um ein neues Passwort zu wählen. Falls Sie dies nicht angefordert haben, ignorieren Sie diese E-Mail",
    button: "Passwort zurücksetzen",
    expires: "Dieser Link ist eine Stunde gültig",
    footer: "Deutschania - Ihr Shop für deutsche Produkte",
  },
  en: {
    subject: "Reset your password - Deutschania",
    heading: "Reset your password",
    body: "You requested to reset the password for your Deutschania account. Click below to choose a new password. If you didn't request this, ignore this email",
    button: "Reset password",
    expires: "This link is valid for 1 hour",
    footer: "Deutschania - German products store",
  },
} as const;

type EmailCopy = {
  subject: string;
  heading: string;
  body: string;
  button: string;
  expires: string;
  footer: string;
};

function renderEmailHtml(dir: "rtl" | "ltr", t: EmailCopy, url: string) {
  return `
    <div dir="${dir}" style="font-family:'IBM Plex Sans',Arial,sans-serif;background:#EEECE5;padding:32px 16px;">
      <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
        <div style="background:#5C7A5E;color:#F5F3EE;padding:24px;text-align:center;font-size:1.25rem;font-weight:700;">
          Deutschania
        </div>
        <div style="padding:28px 24px;color:#1A1D1E;text-align:center;">
          <h1 style="font-size:1.2rem;margin:0 0 12px;">${t.heading}</h1>
          <p style="font-size:0.95rem;line-height:1.7;margin:0 0 24px;">${t.body}</p>
          <div style="margin-bottom:20px;">
            <a href="${url}" style="display:inline-block;background:#FCEAAE;color:#5C7A5E;font-weight:600;padding:12px 28px;border-radius:4px;text-decoration:none;">${t.button}</a>
          </div>
          <p style="font-size:0.8rem;opacity:0.65;margin:0;">${t.expires}</p>
        </div>
        <div style="background:#F5F3EE;color:#1A1D1E;opacity:0.6;text-align:center;padding:14px;font-size:0.75rem;">
          ${t.footer}
        </div>
      </div>
    </div>
  `;
}

export async function sendVerificationEmail({
  to,
  verifyUrl,
  lang,
  kind = "register",
}: {
  to: string;
  verifyUrl: string;
  lang: "ar" | "de" | "en";
  kind?: "register" | "emailChange";
}) {
  const t = (kind === "emailChange" ? emailChangeCopy : copy)[lang] ?? copy.en;
  const dir = lang === "ar" ? "rtl" : "ltr";

  await getResend().emails.send({
    from: FROM,
    to,
    subject: t.subject,
    html: renderEmailHtml(dir, t, verifyUrl),
  });
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  lang,
}: {
  to: string;
  resetUrl: string;
  lang: "ar" | "de" | "en";
}) {
  const t = passwordResetCopy[lang] ?? passwordResetCopy.en;
  const dir = lang === "ar" ? "rtl" : "ltr";

  await getResend().emails.send({
    from: FROM,
    to,
    subject: t.subject,
    html: renderEmailHtml(dir, t, resetUrl),
  });
}
