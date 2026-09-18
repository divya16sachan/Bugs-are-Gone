import { FastifyInstance } from "fastify";
import { initMetrics, createMetricsPlugin } from "@ecom/shared";
import { Counter } from "prom-client";

export const baseMetrics = initMetrics({
  serviceName: "user-service",
});

const userSignupsTotal = new Counter({
  name: "user_signups_total",
  help: "Total number of successful user signups",
  registers: [baseMetrics.registry],
});

const userLoginsTotal = new Counter({
  name: "user_logins_total",
  help: "Total number of user login attempts",
  labelNames: ["status"],
  registers: [baseMetrics.registry],
});

export const userMetrics = {
  ...baseMetrics,
  userSignupsTotal,
  userLoginsTotal,
};

export async function registerMetricsMiddleware(app: FastifyInstance) {
  const plugin = createMetricsPlugin(userMetrics, "user-service");
  await app.register(plugin);
}
