// One-time migration script: stockQuantity was added to Product with a default of 0, so every
// pre-existing row landed at 0 (out of stock) the moment the column was created via db:push.
// This gives them all a reasonable starting stock instead. Only touches rows still at exactly
// 0 - any product an admin has already set a real quantity for (including deliberately 0) is
// left untouched. Safe to run more than once (idempotent: a second run only affects rows that
// are still 0, e.g. new products created without setting stock).
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const INITIAL_STOCK = 100;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

(async () => {
  const result = await prisma.product.updateMany({
    where: { stockQuantity: 0 },
    data: { stockQuantity: INITIAL_STOCK },
  });
  console.log(`Updated ${result.count} product(s) to stockQuantity = ${INITIAL_STOCK}.`);
  await prisma.$disconnect();
})();
