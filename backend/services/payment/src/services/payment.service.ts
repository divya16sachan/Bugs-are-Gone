import { prisma } from "../lib/prisma.js";
import { paymentMetrics } from "../middleware/metrics.middleware.js";
import { publishEvent } from "../events/rabbitmq.js";

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

    // Publish payment.processed event to RabbitMQ so Order Service marks order as COMPLETED
    await publishEvent("payment.processed", {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      eventType: "PaymentProcessed",
      timestamp: new Date().toISOString(),
      data: {
        paymentId: txRef,
        orderId: data.orderId,
        userId: data.userId,
        amount: data.amount,
        status: "SUCCESS",
        transactionReference: txRef,
      },
    });

    return payment;
  }

  async getPaymentByOrderId(orderId: string) {
    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });
    return payment;
  }

  async listPayments(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.count(),
    ]);

    return {
      payments,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    };
  }
}

export const paymentService = new PaymentService();

