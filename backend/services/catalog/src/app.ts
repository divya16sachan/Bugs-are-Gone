import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { createLogger, createChaosPlugin } from "@ecom/shared";
import { registerMetricsMiddleware } from "./middleware/metrics.middleware.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { healthRoutes, healthManager } from "./health/health.js";
import { catalogRoutes } from "./routes/index.js";
import { config } from "./config.js";
import { prisma } from "./lib/prisma.js";
import { getRedisClient } from "./services/redis.service.js";

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

  // Enable CORS for frontend
  await app.register(cors, {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
  });

  // Global Error Handler
  app.setErrorHandler(errorHandler as any);

  // RED Metrics Middleware & /metrics Route
  await registerMetricsMiddleware(app);

  // Chaos / Fault-Injection Plugin (Person B)
  await app.register(createChaosPlugin(config.serviceName));

  // Register real dependency health checks
  healthManager.registerCheck("database", async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { name: "database", ok: true };
    } catch (err: any) {
      return { name: "database", ok: false, details: err.message };
    }
  });

  healthManager.registerCheck("redis", async () => {
    try {
      const redis = getRedisClient();
      const ping = await redis.ping();
      return { name: "redis", ok: ping === "PONG" };
    } catch (err: any) {
      return { name: "redis", ok: false, details: err.message };
    }
  });

  // Health check routes
  await app.register(healthRoutes);

  // Domain API Routes
  await app.register(catalogRoutes);

  return app;
}
