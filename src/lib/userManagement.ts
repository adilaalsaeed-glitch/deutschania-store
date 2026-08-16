import { prisma } from "@/lib/db";

// Orders in these statuses represent money actually kept - PENDING never paid, FAILED never
// completed, and CANCELLED was reversed (stock restored, points clawed back, Storno issued - see
// src/lib/returns.ts). "Total spent" only makes sense over what's left after that netting.
const SPENT_STATUSES = new Set(["PAID", "PREPARING", "SHIPPED", "DELIVERED"]);

export type CustomerListRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  suspended: boolean;
  orderCount: number;
  totalSpentCents: number;
};

// Order count is every order ever placed regardless of status (useful for spotting a pattern of
// placing-then-cancelling), while totalSpentCents only counts orders that were actually paid and
// kept - two different questions, both relevant to a moderation decision.
export async function getCustomerList(): Promise<CustomerListRow[]> {
  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      createdAt: true,
      suspended: true,
      orders: { select: { status: true, totalCents: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    createdAt: u.createdAt,
    suspended: u.suspended,
    orderCount: u.orders.length,
    totalSpentCents: u.orders.filter((o) => SPENT_STATUSES.has(o.status)).reduce((sum, o) => sum + o.totalCents, 0),
  }));
}
