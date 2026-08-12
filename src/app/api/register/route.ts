import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";
import { isReferralsEnabled } from "@/lib/settings";

const addressSchema = z.object({
  street: z.string().min(1).max(200),
  buildingNo: z.string().max(50).optional(),
  city: z.string().min(1).max(100),
  postal: z.string().min(1).max(20),
  mobile: z.string().min(1).max(30),
});

const registerSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.email(),
  password: z.string().min(8).max(72),
  dateOfBirth: z.string().optional(),
  address: addressSchema.optional(),
  lang: z.enum(["ar", "de", "en"]).default("ar"),
  ref: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { firstName, lastName, email, password, dateOfBirth, address, lang, ref } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 });
  }

  // The referral system is gated end-to-end behind the flag (not just its UI): while disabled,
  // ?ref= links are inert and don't create any tracking record.
  let referrerId: string | undefined;
  if (ref && (await isReferralsEnabled())) {
    const referrer = await prisma.user.findUnique({ where: { id: ref }, select: { id: true } });
    if (referrer) referrerId = referrer.id;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        phone: address?.mobile,
        ...(address
          ? {
              addresses: {
                create: {
                  street: address.street,
                  buildingNo: address.buildingNo,
                  city: address.city,
                  postalCode: address.postal,
                  country: "",
                  phone: address.mobile,
                  isDefault: true,
                },
              },
            }
          : {}),
      },
      select: { id: true, email: true, firstName: true },
    });

    if (referrerId) {
      await tx.referral.create({ data: { referrerId, referredId: created.id } });
    }

    return created;
  });

  const token = await createVerificationToken(user.id);
  const origin = new URL(request.url).origin;
  const verifyUrl = `${origin}/verify-email?token=${token}`;

  try {
    await sendVerificationEmail({ to: user.email, firstName: user.firstName, verifyUrl, lang });
  } catch (err) {
    // The account was created either way - don't fail registration over a flaky email send.
    // The user can request a fresh link from the login page.
    console.error("Failed to send verification email:", err);
  }

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
