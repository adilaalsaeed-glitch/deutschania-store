import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { prisma } from "@/lib/db";
import { createVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";

const addressSchema = z.object({
  street: z.string().min(1).max(200),
  buildingNo: z.string().max(50).optional(),
  city: z.string().min(1).max(100),
  postal: z.string().min(1).max(20),
  mobile: z.string().refine(isValidPhoneNumber, { error: "INVALID_PHONE" }),
  landline: z
    .string()
    .optional()
    .refine((v) => !v || isValidPhoneNumber(v), { error: "INVALID_PHONE" }),
});

const registerSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.email(),
  password: z.string().min(8).max(72),
  dateOfBirth: z.string().optional(),
  address: addressSchema.optional(),
  lang: z.enum(["ar", "de", "en"]).default("ar"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const customCode = parsed.error.issues.find((i) => i.code === "custom")?.message;
    return NextResponse.json({ error: customCode ?? "VALIDATION_ERROR" }, { status: 400 });
  }

  const { firstName, lastName, email, password, dateOfBirth, address, lang } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
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
                landline: address.landline,
                isDefault: true,
              },
            },
          }
        : {}),
    },
    select: { id: true, email: true },
  });

  const token = await createVerificationToken(user.id);
  const origin = new URL(request.url).origin;
  const verifyUrl = `${origin}/verify-email?token=${token}`;

  try {
    await sendVerificationEmail({ to: user.email, verifyUrl, lang });
  } catch (err) {
    // The account was created either way - don't fail registration over a flaky email send.
    // The user can request a fresh link from the login page.
    console.error("Failed to send verification email:", err);
  }

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
