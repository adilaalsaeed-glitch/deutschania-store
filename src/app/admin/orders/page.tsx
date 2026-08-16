import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminOrdersList } from "@/components/admin/AdminOrdersList";

export default async function AdminOrdersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalCents: true,
      createdAt: true,
      email: true,
      shippingAddress: true,
      trackingNumber: true,
    },
  });

  const rows = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    totalCents: o.totalCents,
    createdAt: o.createdAt,
    email: o.email,
    customerName: (o.shippingAddress as { fullName?: string } | null)?.fullName ?? "",
    trackingNumber: o.trackingNumber,
  }));

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <AdminNav active="orders" />
        <AdminOrdersList orders={rows} />
      </div>
    </div>
  );
}
