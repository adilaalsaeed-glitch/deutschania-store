import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";

const confirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { token, newPassword } = parsed.data;

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record) {
    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
  }

  if (record.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: record.id } });
    return NextResponse.json({ error: "TOKEN_EXPIRED" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  // The token is only ever consumed here, on the actual password change - never
  // just from opening the reset-password page (see src/app/reset-password/page.tsx).
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return NextResponse.json({ ok: true });
}
