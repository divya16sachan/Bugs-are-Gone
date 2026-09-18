import { FastifyInstance } from "fastify";
import { initMetrics, createMetricsPlugin } from "@ecom/shared";

export const userMetrics = initMetrics({
  serviceName: "user-service",
});

export async function registerMetricsMiddleware(app: FastifyInstance) {
  const plugin = createMetricsPlugin(userMetrics, "user-service");
  await app.register(plugin);
}
