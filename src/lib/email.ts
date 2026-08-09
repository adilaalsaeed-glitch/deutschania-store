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
    subject: "أكّد بريدك الإلكتروني - deutschania",
    heading: "أهلًا بك في deutschania",
    body: "شكرًا لتسجيلك. اضغط الزر بالأسفل لتأكيد بريدك الإلكتروني وتفعيل حسابك.",
    button: "تأكيد البريد الإلكتروني",
    expires: "هذا الرابط صالح لمدة 24 ساعة.",
    ignore: "إذا لم تقم بإنشاء هذا الحساب، تجاهل هذه الرسالة.",
  },
  de: {
    subject: "Bestätigen Sie Ihre E-Mail-Adresse - deutschania",
    heading: "Willkommen bei deutschania",
    body: "Danke für Ihre Registrierung. Klicken Sie auf die Schaltfläche unten, um Ihre E-Mail-Adresse zu bestätigen und Ihr Konto zu aktivieren.",
    button: "E-Mail bestätigen",
    expires: "Dieser Link ist 24 Stunden gültig.",
    ignore: "Wenn Sie dieses Konto nicht erstellt haben, ignorieren Sie diese E-Mail.",
  },
  en: {
    subject: "Confirm your email - deutschania",
    heading: "Welcome to deutschania",
    body: "Thanks for signing up. Click the button below to verify your email and activate your account.",
    button: "Verify email",
    expires: "This link is valid for 24 hours.",
    ignore: "If you didn't create this account, you can safely ignore this email.",
  },
} as const;

export async function sendVerificationEmail({
  to,
  firstName,
  verifyUrl,
  lang,
}: {
  to: string;
  firstName: string;
  verifyUrl: string;
  lang: "ar" | "de" | "en";
}) {
  const t = copy[lang] ?? copy.en;
  const dir = lang === "ar" ? "rtl" : "ltr";

  const html = `
    <div dir="${dir}" style="font-family:'IBM Plex Sans',Arial,sans-serif;background:#EEECE5;padding:32px 16px;">
      <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
        <div style="background:#5C7A5E;color:#F5F3EE;padding:24px;text-align:center;font-size:1.25rem;font-weight:700;">
          deutschania
        </div>
        <div style="padding:28px 24px;color:#1A1D1E;">
          <h1 style="font-size:1.2rem;margin:0 0 12px;">${t.heading}, ${firstName}</h1>
          <p style="font-size:0.95rem;line-height:1.7;margin:0 0 22px;">${t.body}</p>
          <div style="text-align:center;margin-bottom:22px;">
            <a href="${verifyUrl}" style="display:inline-block;background:#FCEAAE;color:#5C7A5E;font-weight:600;padding:12px 28px;border-radius:4px;text-decoration:none;">${t.button}</a>
          </div>
          <p style="font-size:0.8rem;opacity:0.65;margin:0 0 4px;">${t.expires}</p>
          <p style="font-size:0.8rem;opacity:0.65;margin:0;">${t.ignore}</p>
        </div>
      </div>
    </div>
  `;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: t.subject,
    html,
  });
}
