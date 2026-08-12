import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";

const emailChangeSchema = z.object({
  newEmail: z.email(),
  currentPassword: z.string().min(1),
  lang: z.enum(["ar", "de", "en"]).default("ar"),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = emailChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { newEmail, currentPassword, lang } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "INVALID_PASSWORD" }, { status: 400 });
  }

  if (newEmail === user.email) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existing) {
    return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 });
  }

  // The current email stays active and verified until this link is opened -
  // see the newEmail branch in src/app/verify-email/page.tsx.
  const token = await createVerificationToken(user.id, newEmail);
  const origin = new URL(request.url).origin;
  const verifyUrl = `${origin}/verify-email?token=${token}`;

  try {
    await sendVerificationEmail({ to: newEmail, verifyUrl, lang, kind: "emailChange" });
  } catch (err) {
    console.error("Failed to send email-change verification email:", err);
    return NextResponse.json({ error: "UNKNOWN" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
