import { FastifyInstance } from "fastify";
import { initMetrics, createMetricsPlugin } from "@ecom/shared";
import { Counter } from "prom-client";

export const baseMetrics = initMetrics({
  serviceName: "catalog-service",
});

const cacheHitsTotal = new Counter({
  name: "catalog_cache_hits_total",
  help: "Total number of catalog cache hits in Redis",
  registers: [baseMetrics.registry],
});

const cacheMissesTotal = new Counter({
  name: "catalog_cache_misses_total",
  help: "Total number of catalog cache misses in Redis",
  registers: [baseMetrics.registry],
});

const stockReservationsTotal = new Counter({
  name: "catalog_stock_reservations_total",
  help: "Total number of stock reservation attempts",
  labelNames: ["status"],
  registers: [baseMetrics.registry],
});

export const catalogMetrics = {
  ...baseMetrics,
  cacheHitsTotal,
  cacheMissesTotal,
  stockReservationsTotal,
};

export async function registerMetricsMiddleware(app: FastifyInstance) {
  const plugin = createMetricsPlugin(catalogMetrics, "catalog-service");
  await app.register(plugin);
}
