import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminUsersList } from "@/components/admin/AdminUsersList";
import { getCustomerList } from "@/lib/userManagement";

export default async function AdminUsersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const users = await getCustomerList();

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <AdminNav active="users" />
        <AdminUsersList users={users as never} />
      </div>
    </div>
  );
}
