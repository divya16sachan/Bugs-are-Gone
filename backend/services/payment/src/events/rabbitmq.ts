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
        const { orderId, totalAmount } = event.data;

        console.log(`[Payment Consumer] Logged new Order ${orderId} ($${totalAmount}). Order status is PENDING_PAYMENT.`);

        // Acknowledge receipt of order.created event without auto-charging
        ch.ack(msg);
      } catch (err: any) {
        console.error("[Payment Consumer Error]:", err);
        ch.nack(msg, false, false);
      }
    });

    console.log("[Payment RabbitMQ] Consumers started successfully.");
  } catch (err: any) {
    console.error("[Payment RabbitMQ startPaymentConsumers Error]:", err.message);
  }
}
