import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/db";

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
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { firstName, lastName, email, password, dateOfBirth, address } = parsed.data;

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
                isDefault: true,
              },
            },
          }
        : {}),
    },
    select: { id: true, email: true },
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
