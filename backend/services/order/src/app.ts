import Fastify, { FastifyInstance } from "fastify";
import { createLogger } from "@ecom/shared";
import { registerMetricsMiddleware } from "./middleware/metrics.middleware.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { healthRoutes } from "./health/health.js";
import { orderRoutes } from "./routes/index.js";
import { config } from "./config.js";

export async function buildApp(): Promise<FastifyInstance> {
  const logger = createLogger({
    serviceName: config.serviceName,
    level: config.logLevel,
    isDevelopment: config.nodeEnv === "development",
  });

  const app = Fastify({
    logger: logger as any,
    disableRequestLogging: true,
  });

  // Global Error Handler
  app.setErrorHandler(errorHandler as any);

  // RED Metrics Middleware & /metrics Route
  await registerMetricsMiddleware(app);

  // Health check routes
  await app.register(healthRoutes);

  // Domain API Routes
  await app.register(orderRoutes);

  return app;
}
