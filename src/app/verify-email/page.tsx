import Link from "next/link";
import { prisma } from "@/lib/db";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { getDictionary, defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { cookies } from "next/headers";

async function verify(token: string | undefined) {
  if (!token) return "invalid" as const;

  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!record) return "invalid" as const;

  if (record.expiresAt < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { id: record.id } });
    return "expired" as const;
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return "success" as const;
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = await verify(token);

  const jar = await cookies();
  const cookieLocale = jar.get("locale")?.value;
  const locale: Locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const t = getDictionary(locale);

  const copy = {
    success: { title: t.auth.verifySuccessTitle, desc: t.auth.verifySuccessDesc },
    expired: { title: t.auth.verifyExpiredTitle, desc: t.auth.verifyExpiredDesc },
    invalid: { title: t.auth.verifyInvalidTitle, desc: t.auth.verifyInvalidDesc },
  }[result];

  return (
    <SiteChrome>
      <section className="auth-page">
        <div className="auth-inner confirm-box">
          <h1 className="auth-title">{copy.title}</h1>
          <p className="auth-sub">{copy.desc}</p>
          <Link href="/login" className="btn btn-brass" style={{ display: "inline-flex", marginTop: 12 }}>
            {t.auth.goToLogin}
          </Link>
        </div>
      </section>
    </SiteChrome>
  );
}
