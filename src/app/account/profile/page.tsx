import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AccountProfileForm } from "@/components/account/AccountProfileForm";
import { isSupportedCountry } from "@/data/countries";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      addresses: { where: { isDefault: true }, select: { phone: true, landline: true, country: true }, take: 1 },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const address = user.addresses[0];
  const country = address?.country;

  return (
    <AccountProfileForm
      firstName={user.firstName}
      lastName={user.lastName}
      email={user.email}
      mobile={address?.phone ?? ""}
      landline={address?.landline ?? ""}
      country={country && isSupportedCountry(country) ? country : ""}
    />
  );
}
