import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminContentSubmissionsTable } from "@/components/admin/AdminContentSubmissionsTable";

export default async function AdminContentSubmissionsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const submissions = await prisma.contentSubmission.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <AdminNav active="content-submissions" />
        <AdminContentSubmissionsTable submissions={submissions as never} />
      </div>
    </div>
  );
}
