import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const querySchema = z.object({ email: z.email() });

// Used only to pick the right message on the login page ("wrong password" vs
// "please verify your email") - not a security boundary, so a coarse response is fine.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ email: url.searchParams.get("email") });
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { emailVerified: true, suspended: true },
  });

  return NextResponse.json({
    exists: !!user,
    verified: !!user?.emailVerified,
    suspended: !!user?.suspended,
  });
}
