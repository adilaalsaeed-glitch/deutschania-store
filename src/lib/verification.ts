import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function createVerificationToken(userId: string, newEmail?: string) {
  // Invalidate any previous tokens for this user before issuing a fresh one.
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });

  const token = randomBytes(32).toString("hex");
  await prisma.emailVerificationToken.create({
    data: { userId, token, newEmail, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });
  return token;
}
