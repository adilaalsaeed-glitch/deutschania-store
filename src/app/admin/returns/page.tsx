import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminReturnsTable } from "@/components/admin/AdminReturnsTable";

export default async function AdminReturnsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    where: { returnStatus: { not: null } },
    orderBy: { returnRequestedAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      email: true,
      totalCents: true,
      returnStatus: true,
      returnReason: true,
      returnRequestedAt: true,
    },
  });

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <AdminNav active="returns" />
        <AdminReturnsTable orders={orders as never} />
      </div>
    </div>
  );
}
