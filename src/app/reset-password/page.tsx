import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

// Read-only on purpose - never mutates or deletes the token. The token is only ever
// consumed by POST /api/password-reset/confirm, once a new password is actually
// submitted, so opening this link (including email-security link pre-fetchers) can't
// burn it before the real user gets a chance to use it.
async function checkToken(token: string | undefined) {
  if (!token) return "invalid" as const;
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record) return "invalid" as const;
  if (record.expiresAt < new Date()) return "expired" as const;
  return "valid" as const;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const status = await checkToken(token);

  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);

  if (status !== "valid" || !token) {
    const copy =
      status === "expired"
        ? { title: t.auth.resetPasswordExpiredTitle, desc: t.auth.resetPasswordExpiredDesc }
        : { title: t.auth.resetPasswordInvalidTitle, desc: t.auth.resetPasswordInvalidDesc };
    return (
      <SiteChrome>
        <section className="auth-page">
          <div className="auth-inner confirm-box">
            <h1 className="auth-title">{copy.title}</h1>
            <p className="auth-sub">{copy.desc}</p>
            <Link href="/forgot-password" className="btn btn-brass" style={{ display: "inline-flex", marginTop: 12 }}>
              {t.auth.requestNewLink}
            </Link>
          </div>
        </section>
      </SiteChrome>
    );
  }

  return (
    <SiteChrome>
      <section className="auth-page">
        <div className="auth-inner">
          <ResetPasswordForm token={token} />
        </div>
      </section>
    </SiteChrome>
  );
}
