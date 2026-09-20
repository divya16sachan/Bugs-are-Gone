import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Custom RED Metrics Tracking
export const errorRate = new Rate("custom_error_rate");
export const productDuration = new Trend("catalog_duration_ms");
export const orderDuration = new Trend("order_duration_ms");

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

export const options = {
  stages: [
    { duration: "10s", target: 1 },     // Baseline
    { duration: "20s", target: 10 },    // Low concurrency
    { duration: "30s", target: 100 },   // Medium concurrency
    { duration: "40s", target: 500 },   // High concurrency
    { duration: "40s", target: 1000 },  // Peak 1k concurrency
    { duration: "20s", target: 1000 },  // Sustained 1k peak
    { duration: "20s", target: 0 },     // Ramp down / recovery
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],      // Less than 5% errors
    http_req_duration: ["p(95)<1000"],   // 95% under 1s
    custom_error_rate: ["rate<0.05"],
  },
};

export default function () {
  const headers = {
    "Content-Type": "application/json",
  };

  // 1. Browse product catalog
  const catalogRes = http.get(`${BASE_URL}/api/v1/products`, { headers });
  productDuration.add(catalogRes.timings.duration);
  const catalogSuccess = check(catalogRes, {
    "catalog status is 200": (r) => r.status === 200,
  });
  errorRate.add(!catalogSuccess);

  sleep(0.05);

  // 2. Fetch specific product
  const productRes = http.get(`${BASE_URL}/api/v1/products/prod-1`, { headers });
  check(productRes, {
    "product detail status is 200 or 404": (r) => r.status === 200 || r.status === 404,
  });

  sleep(0.05);

  // 3. Create simulated checkout order
  const orderPayload = JSON.stringify({
    userId: "usr-loadtest-1",
    items: [
      {
        productId: "prod-1",
        quantity: 1,
        price: 29.99,
      },
    ],
  });

  const orderRes = http.post(`${BASE_URL}/api/v1/orders`, orderPayload, { headers });
  orderDuration.add(orderRes.timings.duration);
  const orderSuccess = check(orderRes, {
    "order status is 200 or 201": (r) => r.status === 200 || r.status === 201,
  });
  errorRate.add(!orderSuccess);

  sleep(0.1);
}
