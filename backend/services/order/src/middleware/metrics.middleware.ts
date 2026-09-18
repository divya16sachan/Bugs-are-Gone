import { FastifyInstance } from "fastify";
import { initMetrics, createMetricsPlugin } from "@ecom/shared";

export const orderMetrics = initMetrics({
  serviceName: "order-service",
});

export async function registerMetricsMiddleware(app: FastifyInstance) {
  const plugin = createMetricsPlugin(orderMetrics, "order-service");
  await app.register(plugin);
}
