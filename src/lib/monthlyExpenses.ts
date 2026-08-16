import { prisma } from "@/lib/db";

export async function getMonthlyExpenses(year: number, month: number) {
  return prisma.monthlyExpense.findMany({ where: { year, month }, orderBy: { createdAt: "asc" } });
}

export async function getMonthlyExpensesTotalCents(year: number, month: number): Promise<number> {
  const agg = await prisma.monthlyExpense.aggregate({ where: { year, month }, _sum: { amountCents: true } });
  return agg._sum.amountCents ?? 0;
}
