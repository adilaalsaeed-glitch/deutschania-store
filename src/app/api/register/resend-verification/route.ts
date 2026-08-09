import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";

const bodySchema = z.object({
  email: z.email(),
  lang: z.enum(["ar", "de", "en"]).default("ar"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, firstName: true, emailVerified: true },
  });

  // Always return ok - don't reveal whether the email is registered, or leak that it's
  // already verified, to an anonymous caller.
  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  const token = await createVerificationToken(user.id);
  const origin = new URL(request.url).origin;
  const verifyUrl = `${origin}/verify-email?token=${token}`;

  try {
    await sendVerificationEmail({ to: user.email, firstName: user.firstName, verifyUrl, lang: parsed.data.lang });
  } catch (err) {
    console.error("Failed to resend verification email:", err);
    return NextResponse.json({ error: "UNKNOWN" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
