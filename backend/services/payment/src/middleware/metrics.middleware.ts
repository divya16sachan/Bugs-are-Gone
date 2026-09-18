import { FastifyInstance } from "fastify";
import { initMetrics, createMetricsPlugin } from "@ecom/shared";

export const paymentMetrics = initMetrics({
  serviceName: "payment-service",
});

export async function registerMetricsMiddleware(app: FastifyInstance) {
  const plugin = createMetricsPlugin(paymentMetrics, "payment-service");
  await app.register(plugin);
}
