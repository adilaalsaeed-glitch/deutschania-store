import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminProductsTable } from "@/components/admin/AdminProductsTable";
import { AdminSettingsPanel } from "@/components/admin/AdminSettingsPanel";
import { AdminNav } from "@/components/admin/AdminNav";
import { isReferralsEnabled, isContentCouponEnabled, getContentCouponTerms } from "@/lib/settings";

export default async function AdminProductsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const [products, referralsEnabled, contentCouponEnabled, contentCouponTerms] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, slug: true, brand: true, name: true, priceCents: true },
      orderBy: { brand: "asc" },
    }),
    isReferralsEnabled(),
    isContentCouponEnabled(),
    getContentCouponTerms(),
  ]);

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <AdminNav active="products" />
        <AdminSettingsPanel
          referralsEnabled={referralsEnabled}
          contentCouponEnabled={contentCouponEnabled}
          contentCouponPercentage={contentCouponTerms.percentage}
          contentCouponMinOrderCents={contentCouponTerms.minOrderCents}
        />
        <AdminProductsTable products={products as never} />
      </div>
    </div>
  );
}
