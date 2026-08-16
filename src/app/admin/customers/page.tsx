import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminCustomersPanel } from "@/components/admin/AdminCustomersPanel";

export default async function AdminCustomersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <AdminNav active="customers" />
        <AdminCustomersPanel />
      </div>
    </div>
  );
}
