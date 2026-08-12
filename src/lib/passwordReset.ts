import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function createPasswordResetToken(userId: string) {
  // Invalidate any previous reset tokens for this user before issuing a fresh one.
  await prisma.passwordResetToken.deleteMany({ where: { userId } });

  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: { userId, token, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });
  return token;
}
