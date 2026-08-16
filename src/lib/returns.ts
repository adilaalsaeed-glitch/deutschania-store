import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { createStornoInvoice } from "@/lib/invoices";

// 14-day EU/German distance-selling withdrawal right (Widerrufsrecht, §355 BGB). Measured from
// paidAt - see the Order.returnStatus schema comment for why (no real delivery tracking yet).
export const RETURN_WINDOW_DAYS = 14;

export type RequestReturnError = "ORDER_NOT_FOUND" | "NOT_ELIGIBLE" | "WINDOW_EXPIRED" | "ALREADY_REQUESTED";

// Customer-facing: flags an order for admin review. Nothing is reversed yet - stock, points and
// the Storno invoice only move once an admin approves via processReturn.
export async function requestReturn(
  orderId: string,
  userId: string,
  reason: string
): Promise<{ ok: true } | { error: RequestReturnError }> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== userId) return { error: "ORDER_NOT_FOUND" };
  if (order.status !== "PAID" || !order.paidAt) return { error: "NOT_ELIGIBLE" };
  if (order.returnStatus) return { error: "ALREADY_REQUESTED" };

  const deadline = new Date(order.paidAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  if (new Date() > deadline) return { error: "WINDOW_EXPIRED" };

  await prisma.order.update({
    where: { id: order.id },
    data: { returnStatus: "REQUESTED", returnRequestedAt: new Date(), returnReason: reason },
  });
  return { ok: true };
}

// Runs inside an existing $transaction - restores stock and reverses/refunds loyalty points for a
// paid order being cancelled. Shared by the customer-return flow (processReturn, below) and
// direct admin cancellation (src/lib/orderManagement.ts) - same accounting consequences either
// way, since both mean "this paid order is no longer happening". Does not touch order.status
// itself or create the Storno invoice - see issueStornoForCancelledOrder for the post-commit half
// (Storno generation needs real PDF/Blob I/O and can't run inside a DB transaction).
export async function reverseOrderStockAndPoints(
  tx: Prisma.TransactionClient,
  order: { id: string; userId: string | null; pointsRedeemed: number; items: { productId: string | null; quantity: number }[] }
) {
  for (const item of order.items) {
    if (!item.productId) continue;
    await tx.$executeRaw`UPDATE products SET "stockQuantity" = "stockQuantity" + ${item.quantity} WHERE id = ${item.productId}`;
  }

  if (!order.userId) return; // guest order - no account to adjust points on

  const earnTx = await tx.loyaltyTransaction.findFirst({ where: { orderId: order.id, type: "EARN" } });
  if (earnTx && earnTx.points > 0) {
    // Clamped at 0 - same GREATEST pattern as the webhook's stock decrement, in case the
    // balance was already partly spent elsewhere since it was earned.
    await tx.$executeRaw`UPDATE users SET "loyaltyPoints" = GREATEST("loyaltyPoints" - ${earnTx.points}, 0) WHERE id = ${order.userId}`;
    await tx.loyaltyTransaction.create({
      data: { userId: order.userId, type: "RETURN", points: -earnTx.points, orderId: order.id },
    });
  }

  if (order.pointsRedeemed > 0) {
    await tx.user.update({ where: { id: order.userId }, data: { loyaltyPoints: { increment: order.pointsRedeemed } } });
    await tx.loyaltyTransaction.create({
      data: { userId: order.userId, type: "REFUND", points: order.pointsRedeemed, orderId: order.id },
    });
  }
}

// Post-commit half of a cancellation: issues a Storno invoice against the order's original
// invoice (never deletes it). Deliberately outside any DB transaction - PDF generation launches a
// real browser and uploads to Blob storage, too slow to hold one open for, and the cancellation
// itself is already fully recorded even if this fails (logged for manual follow-up).
export async function issueStornoForCancelledOrder(orderId: string, orderNumber: string) {
  const invoice = await prisma.invoice.findUnique({ where: { orderId } });
  if (!invoice) {
    console.error(`No invoice found to correct for cancelled/returned order ${orderNumber}`);
    return;
  }
  try {
    await createStornoInvoice(invoice.id);
  } catch (err) {
    console.error(`Failed to generate Storno invoice for order ${orderNumber}:`, err);
  }
}

export type ProcessReturnDecision = "APPROVE" | "REJECT";
export type ProcessReturnError = "NOT_ELIGIBLE";

// Admin-facing. REJECT just closes out the request. APPROVE, atomically: cancels the order,
// restores stock, claws back any points earned on it, refunds any points that were redeemed
// against it - then issues a Storno invoice against the original (never deletes it). Money
// itself is not touched here by design - PayTabs refunds are a manual admin task.
export async function processReturn(
  orderId: string,
  decision: ProcessReturnDecision
): Promise<{ ok: true } | { error: ProcessReturnError }> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.returnStatus !== "REQUESTED") return { error: "NOT_ELIGIBLE" };

  if (decision === "REJECT") {
    await prisma.order.update({
      where: { id: order.id },
      data: { returnStatus: "REJECTED", returnProcessedAt: new Date() },
    });
    return { ok: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { returnStatus: "APPROVED", returnProcessedAt: new Date(), status: "CANCELLED" },
    });
    await reverseOrderStockAndPoints(tx, order);
  });

  await issueStornoForCancelledOrder(order.id, order.orderNumber);

  return { ok: true };
}
