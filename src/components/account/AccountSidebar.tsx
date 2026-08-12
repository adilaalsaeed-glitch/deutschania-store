"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { useSignOutConfirm } from "@/components/SignOutConfirmProvider";

export function AccountSidebar() {
  const { t } = useLocale();
  const pathname = usePathname();
  const { requestSignOut } = useSignOutConfirm();

  const links = [
    { href: "/account/profile", label: t.account.sidebar.profile },
    { href: "/account/coupons", label: t.account.couponsCard },
    { href: "/account/points", label: t.account.pointsCard },
    { href: "/account/rewards", label: t.nav.rewardsPrograms },
    { href: "/account/address-book", label: t.account.sidebar.addressBook },
    { href: "/account/payment-methods", label: t.account.sidebar.paymentMethods },
    { href: "/account/policies", label: t.account.sidebar.policies },
  ];

  return (
    <nav className="account-sidebar">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className={pathname === link.href ? "active" : ""}>
          {link.label}
        </Link>
      ))}
      <button type="button" onClick={requestSignOut}>
        {t.account.menu.logout}
      </button>
    </nav>
  );
}
