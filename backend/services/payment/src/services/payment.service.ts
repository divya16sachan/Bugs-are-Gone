import { prisma } from "../lib/prisma.js";
import { paymentMetrics } from "../middleware/metrics.middleware.js";

export class PaymentService {
  async processPaymentSync(data: { orderId: string; userId: string; amount: number }) {
    const txRef = `tx_sync_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const payment = await prisma.payment.upsert({
      where: { orderId: data.orderId },
      create: {
        orderId: data.orderId,
        userId: data.userId,
        amount: data.amount,
        status: "SUCCESS",
        transactionReference: txRef,
      },
      update: {
        status: "SUCCESS",
        transactionReference: txRef,
      },
    });

    paymentMetrics.paymentTransactionsTotal.inc({ status: "success" });
    return payment;
  }
}

export const paymentService = new PaymentService();
