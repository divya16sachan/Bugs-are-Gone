import { FastifyInstance } from "fastify";
import { initMetrics, createMetricsPlugin } from "@ecom/shared";

export const catalogMetrics = initMetrics({
  serviceName: "catalog-service",
});

export async function registerMetricsMiddleware(app: FastifyInstance) {
  const plugin = createMetricsPlugin(catalogMetrics, "catalog-service");
  await app.register(plugin);
}
