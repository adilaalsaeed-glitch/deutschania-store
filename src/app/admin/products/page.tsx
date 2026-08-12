import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminProductsTable } from "@/components/admin/AdminProductsTable";
import { AdminSettingsPanel } from "@/components/admin/AdminSettingsPanel";
import { isReferralsEnabled } from "@/lib/settings";

export default async function AdminProductsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const [products, referralsEnabled] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, slug: true, brand: true, name: true, priceCents: true },
      orderBy: { brand: "asc" },
    }),
    isReferralsEnabled(),
  ]);

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <AdminSettingsPanel referralsEnabled={referralsEnabled} />
        <AdminProductsTable products={products as never} />
      </div>
    </div>
  );
}
