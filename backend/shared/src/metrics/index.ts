import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import client, { Registry, Counter, Histogram } from "prom-client";

export interface MetricsConfig {
  serviceName: string;
  customRegistry?: Registry;
  collectDefaultMetrics?: boolean;
}

export interface ServiceMetrics {
  registry: Registry;
  httpRequestsTotal: Counter<string>;
  httpRequestDurationSeconds: Histogram<string>;
}

export function initMetrics(config: MetricsConfig): ServiceMetrics {
  const registry = config.customRegistry || new Registry();

  if (config.collectDefaultMetrics !== false) {
    client.collectDefaultMetrics({
      register: registry,
      prefix: "nodejs_",
      labels: { service: config.serviceName },
    });
  }

  const httpRequestsTotal = new Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests processed",
    labelNames: ["service", "method", "route", "status_code"],
    registers: [registry],
  });

  const httpRequestDurationSeconds = new Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["service", "method", "route", "status_code"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [registry],
  });

  return {
    registry,
    httpRequestsTotal,
    httpRequestDurationSeconds,
  };
}

export function createMetricsPlugin(metrics: ServiceMetrics, serviceName: string): FastifyPluginAsync {
  const plugin: FastifyPluginAsync = async (fastify) => {
    // Record start time on request
    fastify.addHook("onRequest", async (request: FastifyRequest) => {
      (request as any).startTime = process.hrtime();
    });

    // Record metrics on response finish
    fastify.addHook("onResponse", async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = (request as any).startTime;
      if (!startTime) return;

      const diff = process.hrtime(startTime);
      const durationInSeconds = diff[0] + diff[1] / 1e9;

      const route = request.routeOptions?.url || request.url.split("?")[0] || "unknown";
      const method = request.method;
      const statusCode = reply.statusCode.toString();

      // Don't track /metrics requests to avoid self-pollution
      if (route === "/metrics") return;

      metrics.httpRequestsTotal.inc({
        service: serviceName,
        method,
        route,
        status_code: statusCode,
      });

      metrics.httpRequestDurationSeconds.observe(
        {
          service: serviceName,
          method,
          route,
          status_code: statusCode,
        },
        durationInSeconds
      );
    });

    // Expose /metrics route
    fastify.get("/metrics", async (_request, reply) => {
      const metricsData = await metrics.registry.metrics();
      reply.header("Content-Type", metrics.registry.contentType).send(metricsData);
    });
  };

  return fp(plugin, {
    name: "fastify-prom-metrics",
  });
}

export { client as promClient };
