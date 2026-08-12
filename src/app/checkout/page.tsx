import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { CheckoutForm, type CheckoutFormValues } from "@/components/CheckoutForm";

async function loadInitialValues(): Promise<CheckoutFormValues> {
  const blank: CheckoutFormValues = { fullName: "", email: "", address: "", city: "", postal: "", country: "", phone: "" };

  const session = await auth();
  if (!session?.user) return blank;

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
  if (!user) return blank;

  const addr = user.addresses[0];
  return {
    fullName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    address: addr ? [addr.street, addr.buildingNo].filter(Boolean).join(" ") : "",
    city: addr?.city ?? "",
    postal: addr?.postalCode ?? "",
    country: addr?.country ?? "",
    phone: addr?.phone ?? "",
  };
}

export default async function CheckoutPage() {
  const initialValues = await loadInitialValues();

  return (
    <SiteChrome>
      <CheckoutForm initialValues={initialValues} />
    </SiteChrome>
  );
}
