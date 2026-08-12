import { NextResponse } from "next/server";
import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const profileSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  mobile: z.string().refine(isValidPhoneNumber, { error: "INVALID_PHONE" }),
  landline: z
    .string()
    .optional()
    .refine((v) => !v || isValidPhoneNumber(v), { error: "INVALID_PHONE" }),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    const customCode = parsed.error.issues.find((i) => i.code === "custom")?.message;
    return NextResponse.json({ error: customCode ?? "VALIDATION_ERROR" }, { status: 400 });
  }

  const { firstName, lastName, mobile, landline } = parsed.data;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { firstName, lastName, phone: mobile },
    }),
    // No-ops if the user has no default address yet, rather than failing - Address
    // requires street/city/postal we don't have here to create one from scratch.
    prisma.address.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { phone: mobile, landline: landline || null },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
