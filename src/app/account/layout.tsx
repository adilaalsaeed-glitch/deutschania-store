import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { AccountSidebar } from "@/components/account/AccountSidebar";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SiteChrome>
      <section className="account-page">
        <div className="account-inner">
          <AccountSidebar />
          <div className="account-content">{children}</div>
        </div>
      </section>
    </SiteChrome>
  );
}
