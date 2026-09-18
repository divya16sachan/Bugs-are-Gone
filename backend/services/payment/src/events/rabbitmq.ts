import amqp from "amqplib";
import { config } from "../config.js";
import { prisma } from "../lib/prisma.js";
import { paymentMetrics } from "../middleware/metrics.middleware.js";

let connection: any = null;
let channel: amqp.Channel | null = null;

const EXCHANGE = "ecommerce";
const QUEUE_ORDER_CREATED = "payment.order_created.queue";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getRabbitMQChannel(): Promise<amqp.Channel> {
  if (channel) return channel;

  connection = await amqp.connect(config.rabbitmqUrl);
  channel = await connection.createChannel();

  if (!channel) {
    throw new Error("Failed to create RabbitMQ channel");
  }

  await channel.assertExchange(EXCHANGE, "topic", { durable: true });

  connection.on("error", (err: any) => {
    console.error("[Payment RabbitMQ Connection Error]:", err.message);
    connection = null;
    channel = null;
  });

  return channel;
}

export async function publishEvent<T>(routingKey: string, payload: T): Promise<void> {
  try {
    const ch = await getRabbitMQChannel();
    ch.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
      contentType: "application/json",
    });
    console.log(`[Payment RabbitMQ] Published event '${routingKey}'`);
  } catch (err: any) {
    console.error(`[Payment RabbitMQ publishEvent Error on ${routingKey}]:`, err.message);
  }
}

export async function startPaymentConsumers(): Promise<void> {
  try {
    const ch = await getRabbitMQChannel();

    await ch.assertQueue(QUEUE_ORDER_CREATED, { durable: true });
    await ch.bindQueue(QUEUE_ORDER_CREATED, EXCHANGE, "order.created");

    // Set prefetch to 5 for concurrent processing
    await ch.prefetch(5);

    ch.consume(QUEUE_ORDER_CREATED, async (msg) => {
      if (!msg) return;

      try {
        const rawContent = msg.content.toString();
        const event = JSON.parse(rawContent);
        const { orderId, userId, totalAmount } = event.data;

        // Measure lag from order creation to processing
        if (event.timestamp) {
          const lagSeconds = (Date.now() - new Date(event.timestamp).getTime()) / 1000;
          paymentMetrics.paymentQueueConsumerLagSeconds.observe(Math.max(0, lagSeconds));
        }

        console.log(`[Payment Consumer] Processing payment for Order ${orderId} ($${totalAmount})...`);

        // Simulate 1.5s - 3.5s payment gateway network roundtrip
        const processingDelay = 1500 + Math.random() * 2000;
        await sleep(processingDelay);

        // Check artificial failure rate (default 10% or 0.1)
        const isFailure = Math.random() < config.artificialFailureRate;

        if (isFailure) {
          console.warn(`[Payment Consumer] Simulating payment failure for Order ${orderId}`);

          await prisma.payment.upsert({
            where: { orderId },
            create: {
              orderId,
              userId,
              amount: totalAmount,
              status: "FAILED",
              transactionReference: null,
            },
            update: {
              status: "FAILED",
            },
          });

          paymentMetrics.paymentTransactionsTotal.inc({ status: "failed" });

          await publishEvent("payment.failed", {
            eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            eventType: "PaymentFailed",
            timestamp: new Date().toISOString(),
            data: {
              orderId,
              userId,
              amount: totalAmount,
              reason: "SIMULATED_TRANSACTION_FAILURE",
            },
          });
        } else {
          const txRef = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;

          await prisma.payment.upsert({
            where: { orderId },
            create: {
              orderId,
              userId,
              amount: totalAmount,
              status: "SUCCESS",
              transactionReference: txRef,
            },
            update: {
              status: "SUCCESS",
              transactionReference: txRef,
            },
          });

          paymentMetrics.paymentTransactionsTotal.inc({ status: "success" });

          await publishEvent("payment.processed", {
            eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            eventType: "PaymentProcessed",
            timestamp: new Date().toISOString(),
            data: {
              paymentId: txRef,
              orderId,
              userId,
              amount: totalAmount,
              status: "SUCCESS",
              transactionReference: txRef,
            },
          });

          console.log(`[Payment Consumer] Payment SUCCESS for Order ${orderId}`);
        }

        ch.ack(msg);
      } catch (err: any) {
        console.error("[Payment Consumer Error]:", err);
        // Nack without requeue if unrecoverable
        ch.nack(msg, false, false);
      }
    });

    console.log("[Payment RabbitMQ] Consumers started successfully.");
  } catch (err: any) {
    console.error("[Payment RabbitMQ startPaymentConsumers Error]:", err.message);
  }
}
