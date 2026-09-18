import amqp from "amqplib";
import { config } from "../config.js";
import { prisma } from "../lib/prisma.js";

let connection: any = null;
let channel: amqp.Channel | null = null;

const EXCHANGE = "ecommerce";

export async function getRabbitMQChannel(): Promise<amqp.Channel> {
  if (channel) return channel;

  connection = await amqp.connect(config.rabbitmqUrl);
  channel = await connection.createChannel();

  if (!channel) {
    throw new Error("Failed to create RabbitMQ channel");
  }

  // Assert topic exchange
  await channel.assertExchange(EXCHANGE, "topic", { durable: true });

  connection.on("error", (err: any) => {
    console.error("[Order RabbitMQ Connection Error]:", err.message);
    connection = null;
    channel = null;
  });

  return channel;
}

export async function publishOrderCreated(order: {
  id: string;
  userId: string;
  totalAmount: number;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
}): Promise<void> {
  try {
    const ch = await getRabbitMQChannel();
    const event = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      eventType: "OrderCreated",
      timestamp: new Date().toISOString(),
      data: {
        orderId: order.id,
        userId: order.userId,
        totalAmount: order.totalAmount,
        items: order.items,
      },
    };

    ch.publish(EXCHANGE, "order.created", Buffer.from(JSON.stringify(event)), {
      persistent: true,
      contentType: "application/json",
    });

    console.log(`[Order RabbitMQ] Published order.created for order ${order.id}`);
  } catch (err: any) {
    console.error("[Order RabbitMQ publishOrderCreated Error]:", err.message);
  }
}

export async function startOrderConsumers(): Promise<void> {
  try {
    const ch = await getRabbitMQChannel();

    // 1. Payment Processed Queue
    const paidQueue = "order.payment_processed.queue";
    await ch.assertQueue(paidQueue, { durable: true });
    await ch.bindQueue(paidQueue, EXCHANGE, "payment.processed");

    ch.consume(paidQueue, async (msg) => {
      if (!msg) return;
      try {
        const event = JSON.parse(msg.content.toString());
        const { orderId } = event.data;
        console.log(`[Order Consumer] Received payment.processed for order ${orderId}`);

        await prisma.order.update({
          where: { id: orderId },
          data: { status: "COMPLETED" },
        });

        ch.ack(msg);
      } catch (err) {
        console.error("[Order Consumer payment.processed Error]:", err);
        ch.nack(msg, false, false);
      }
    });

    // 2. Payment Failed Queue
    const failedQueue = "order.payment_failed.queue";
    await ch.assertQueue(failedQueue, { durable: true });
    await ch.bindQueue(failedQueue, EXCHANGE, "payment.failed");

    ch.consume(failedQueue, async (msg) => {
      if (!msg) return;
      try {
        const event = JSON.parse(msg.content.toString());
        const { orderId } = event.data;
        console.log(`[Order Consumer] Received payment.failed for order ${orderId}`);

        await prisma.order.update({
          where: { id: orderId },
          data: { status: "FAILED" },
        });

        ch.ack(msg);
      } catch (err) {
        console.error("[Order Consumer payment.failed Error]:", err);
        ch.nack(msg, false, false);
      }
    });

    console.log("[Order RabbitMQ] Consumers started successfully.");
  } catch (err: any) {
    console.error("[Order RabbitMQ startOrderConsumers Error]:", err.message);
  }
}
