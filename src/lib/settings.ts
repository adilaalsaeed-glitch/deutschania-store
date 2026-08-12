import { prisma } from "@/lib/db";

const REFERRALS_ENABLED_KEY = "referrals_enabled";

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

// Off by default: absence of the row (pre-launch, or before an admin ever touches the toggle)
// means disabled, not enabled.
export async function isReferralsEnabled(): Promise<boolean> {
  const value = await getSetting(REFERRALS_ENABLED_KEY);
  return value === "true";
}

export async function setReferralsEnabled(enabled: boolean): Promise<void> {
  await setSetting(REFERRALS_ENABLED_KEY, enabled ? "true" : "false");
}

export { REFERRALS_ENABLED_KEY };
