"use client";

import { useLocale } from "@/components/LocaleProvider";
import { ComingSoon } from "@/components/account/ComingSoon";

export default function AddressBookPage() {
  const { t } = useLocale();
  return <ComingSoon title={t.account.sidebar.addressBook} />;
}
