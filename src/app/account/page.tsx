import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AccountDashboard } from "@/components/account/AccountDashboard";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const grouped = await prisma.order.groupBy({
    by: ["status"],
    where: { userId: session.user.id },
    _count: true,
  });

  const statusCounts: Record<string, number> = {};
  let totalOrders = 0;
  for (const row of grouped) {
    statusCounts[row.status] = row._count;
    totalOrders += row._count;
  }

  return (
    <AccountDashboard
      userName={session.user.name ?? ""}
      statusCounts={statusCounts}
      totalOrders={totalOrders}
    />
  );
}
