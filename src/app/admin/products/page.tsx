import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminProductsTable } from "@/components/admin/AdminProductsTable";

export default async function AdminProductsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const products = await prisma.product.findMany({
    select: { id: true, slug: true, brand: true, name: true, priceCents: true },
    orderBy: { brand: "asc" },
  });

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <AdminProductsTable products={products as never} />
      </div>
    </div>
  );
}
