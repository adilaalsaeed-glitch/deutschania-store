import { prisma } from "@/lib/db";
import { reverseOrderStockAndPoints, issueStornoForCancelledOrder } from "@/lib/returns";
import { sendOrderStatusEmail } from "@/lib/email";
import type { Locale } from "@/i18n/config";

// The admin-driven fulfillment pipeline: PAID ("Processing") -> PREPARING -> SHIPPED ->
// DELIVERED. PENDING/FAILED aren't part of it (system-set by the payment flow, not something an
// admin manually advances), and CANCELLED is a same-enum side branch rather than a stage.
const FULFILLMENT_STAGES = ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] as const;
type FulfillmentStage = (typeof FULFILLMENT_STAGES)[number];

export type OrderStatusValue =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

// What an admin may move an order to next, from its current status. Skipping ahead (e.g. PAID
// straight to DELIVERED for a manually-fulfilled sale) is allowed; moving backward is not - if a
// mistake needs correcting that's a support/DB fix, not a button on this page. Cancelling is only
// offered pre-shipment: once an order has shipped, reversing it is a *return* (the existing
// requestReturn/processReturn flow), not a fulfillment-status change.
export function allowedNextStatuses(current: OrderStatusValue): OrderStatusValue[] {
  if (current === "CANCELLED" || current === "FAILED" || current === "DELIVERED") return [];
  if (current === "PENDING") return ["CANCELLED"]; // nothing to progress yet - only a stale unpaid order can be cancelled here
  const idx = FULFILLMENT_STAGES.indexOf(current as FulfillmentStage);
  if (idx === -1) return [];
  const forward = FULFILLMENT_STAGES.slice(idx + 1) as OrderStatusValue[];
  const canCancel = current === "PAID" || current === "PREPARING";
  return canCancel ? [...forward, "CANCELLED"] : forward;
}

export type UpdateOrderStatusError = "NOT_FOUND" | "INVALID_TRANSITION";

export async function updateOrderStatus(
  orderId: string,
  targetStatus: OrderStatusValue,
  options: { trackingNumber?: string; cancelReason?: string; adminUserId: string; orderUrl: string }
): Promise<{ ok: true } | { error: UpdateOrderStatusError }> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { error: "NOT_FOUND" };

  if (!allowedNextStatuses(order.status).includes(targetStatus)) {
    return { error: "INVALID_TRANSITION" };
  }

  if (targetStatus === "CANCELLED") {
    // Only PAID/PREPARING orders carry real stock/points/invoice impact to reverse - a still-
    // PENDING order (the other state cancellation is allowed from) never decremented anything.
    const needsReversal = order.status === "PAID" || order.status === "PREPARING";

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: options.cancelReason || null },
      });
      if (needsReversal) await reverseOrderStockAndPoints(tx, order);
    });

    if (needsReversal) await issueStornoForCancelledOrder(order.id, order.orderNumber);
    return { ok: true };
  }

  const now = new Date();
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: targetStatus,
      ...(targetStatus === "PREPARING" && { preparingAt: now }),
      ...(targetStatus === "SHIPPED" && { shippedAt: now, trackingNumber: options.trackingNumber || null }),
      ...(targetStatus === "DELIVERED" && { deliveredAt: now }),
    },
  });

  if (targetStatus === "SHIPPED" || targetStatus === "DELIVERED") {
    // Outside the update above (already committed) - sending an email is real network I/O, and a
    // failure to notify shouldn't roll back or fail the status change itself.
    try {
      await sendOrderStatusEmail({
        to: order.email,
        orderNumber: order.orderNumber,
        status: targetStatus,
        trackingNumber: targetStatus === "SHIPPED" ? options.trackingNumber || order.trackingNumber : null,
        orderUrl: options.orderUrl,
        lang: order.lang as Locale,
      });
    } catch (err) {
      console.error(`Failed to send ${targetStatus} notification email for order ${order.orderNumber}:`, err);
    }
  }

  return { ok: true };
}
