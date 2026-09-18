import express from "express";
import client from "prom-client";

const app = express();
const PORT = 9000;

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["service", "method", "endpoint", "status_code"],
});

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["service", "method", "endpoint"],
});

const cacheHitsTotal = new client.Counter({
  name: "cache_hits_total",
  help: "Total cache hits",
});

const cacheMissesTotal = new client.Counter({
  name: "cache_misses_total",
  help: "Total cache misses",
});

const ordersCreatedTotal = new client.Counter({
  name: "orders_created_total",
  help: "Total orders created",
});

const orderStatusTotal = new client.Counter({
  name: "order_status_total",
  help: "Total orders by status",
  labelNames: ["status"],
});

const paymentsProcessedTotal = new client.Counter({
  name: "payments_processed_total",
  help: "Total payments processed",
  labelNames: ["result"],
});

const paymentProcessingSeconds = new client.Histogram({
  name: "payment_processing_seconds",
  help: "Payment processing duration in seconds",
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);
register.registerMetric(cacheHitsTotal);
register.registerMetric(cacheMissesTotal);
register.registerMetric(ordersCreatedTotal);
register.registerMetric(orderStatusTotal);
register.registerMetric(paymentsProcessedTotal);
register.registerMetric(paymentProcessingSeconds);

app.get("/metrics", async (_req, res) => {
  httpRequestsTotal.inc({
    service: "metrics-stub",
    method: "GET",
    endpoint: "/metrics",
    status_code: "200",
  });

  httpRequestDuration.observe(
    {
      service: "metrics-stub",
      method: "GET",
      endpoint: "/metrics",
    },
    Math.random() * 0.5,
  );

  cacheHitsTotal.inc(Math.floor(Math.random() * 10));
  cacheMissesTotal.inc(Math.floor(Math.random() * 5));
  ordersCreatedTotal.inc(Math.floor(Math.random() * 5));
  orderStatusTotal.inc(
    { status: "completed" },
    Math.floor(Math.random() * 5),
  );
  paymentsProcessedTotal.inc(
    { result: "success" },
    Math.floor(Math.random() * 5),
  );
  paymentProcessingSeconds.observe(Math.random());

  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Metrics stub running on http://localhost:${PORT}`);
});