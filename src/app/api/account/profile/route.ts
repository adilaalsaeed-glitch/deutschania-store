import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SUPPORTED_COUNTRIES, isSupportedCountry, splitPhone, type CountryCode } from "@/data/countries";

const countryCodes = SUPPORTED_COUNTRIES.map((c) => c.code) as [CountryCode, ...CountryCode[]];

const profileSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  country: z.enum(countryCodes),
  mobile: z.string().min(1).max(30),
  landline: z.string().max(30).optional(),
});

// Used by the checkout page to prefill the shipping form from the user's saved default
// address (a simple client-side fetch, rather than threading this through a server component).
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      addresses: {
        where: { isDefault: true },
        take: 1,
        select: { street: true, buildingNo: true, city: true, postalCode: true, country: true, phone: true },
      },
    },
  });
  if (!user) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const addr = user.addresses[0];
  const country = addr?.country && isSupportedCountry(addr.country) ? addr.country : "";
  const phone = addr?.phone ? splitPhone(addr.phone).localNumber : "";

  return NextResponse.json({
    fullName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    address: addr ? [addr.street, addr.buildingNo].filter(Boolean).join(" ") : "",
    city: addr?.city ?? "",
    postal: addr?.postalCode ?? "",
    country,
    phone,
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { firstName, lastName, country, mobile, landline } = parsed.data;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { firstName, lastName, phone: mobile },
    }),
    // No-ops if the user has no default address yet, rather than failing - Address
    // requires street/city/postal we don't have here to create one from scratch.
    prisma.address.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { phone: mobile, landline: landline || null, country },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
