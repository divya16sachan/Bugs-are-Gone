import { FastifyInstance } from "fastify";
import { initMetrics, createMetricsPlugin } from "@ecom/shared";
import { Counter, Histogram } from "prom-client";

export const baseMetrics = initMetrics({
  serviceName: "order-service",
});

const ordersCreatedTotal = new Counter({
  name: "orders_created_total",
  help: "Total number of orders created",
  registers: [baseMetrics.registry],
});

const orderProcessingDurationSeconds = new Histogram({
  name: "order_processing_duration_seconds",
  help: "Duration of order creation process in seconds",
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [baseMetrics.registry],
});

export const orderMetrics = {
  ...baseMetrics,
  ordersCreatedTotal,
  orderProcessingDurationSeconds,
};

export async function registerMetricsMiddleware(app: FastifyInstance) {
  const plugin = createMetricsPlugin(orderMetrics, "order-service");
  await app.register(plugin);
}
