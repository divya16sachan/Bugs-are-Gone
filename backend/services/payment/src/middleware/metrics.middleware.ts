import { FastifyInstance } from "fastify";
import { initMetrics, createMetricsPlugin } from "@ecom/shared";
import { Counter, Histogram } from "prom-client";

export const baseMetrics = initMetrics({
  serviceName: "payment-service",
});

const paymentTransactionsTotal = new Counter({
  name: "payment_transactions_total",
  help: "Total number of payment transactions processed",
  labelNames: ["status"],
  registers: [baseMetrics.registry],
});

const paymentQueueConsumerLagSeconds = new Histogram({
  name: "payment_queue_consumer_lag_seconds",
  help: "Time elapsed from order creation event timestamp to payment consumption in seconds",
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [baseMetrics.registry],
});

export const paymentMetrics = {
  ...baseMetrics,
  paymentTransactionsTotal,
  paymentQueueConsumerLagSeconds,
};

export async function registerMetricsMiddleware(app: FastifyInstance) {
  const plugin = createMetricsPlugin(paymentMetrics, "payment-service");
  await app.register(plugin);
}
