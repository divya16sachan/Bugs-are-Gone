# Service Level Objectives (SLOs) & Service Level Indicators (SLIs)

This document defines the production Service Level Objectives (SLOs) and Service Level Indicators (SLIs) for the E-Commerce Microservices System.

---

## 1. Availability SLO

- **Objective:** 99.0% of all incoming HTTP requests return non-5xx status codes across all microservices.
- **SLI Specification:** Ratio of non-5xx HTTP requests to total HTTP requests over a rolling 5-minute evaluation window.
- **PromQL Calculation:**
  ```promql
  (1 - (sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])))) * 100
  ```
- **Target:** $\ge 99.0\%$
- **Error Budget:** $1.0\%$ allowed 5xx failures over the evaluation period.
- **Triggered Alert:** `HighErrorRate` fires if the 5xx rate exceeds 5.0% for longer than 2 minutes.

---

## 2. Latency SLO

- **Objective:** 95% of incoming HTTP requests across all services complete in under 1.0 second.
- **SLI Specification:** The 95th percentile (p95) HTTP request duration measured via Prometheus histogram metrics.
- **PromQL Calculation:**
  ```promql
  histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))
  ```
- **Target:** $p95 < 1.0\text{ s}$ (Internal warning threshold: $0.5\text{ s}$)
- **Triggered Alert:** `HighLatency` fires if p95 response time exceeds 1.0s for longer than 2 minutes.

---

## 3. Order Fulfillment & Pipeline SLO

- **Objective:** 95% of submitted customer orders reach a terminal state (`COMPLETED` or `FAILED`) within 10 seconds of creation, avoiding message stagnation in `PENDING_PAYMENT`.
- **SLI Specification:** Payment consumer processing lag and duration from order creation event publishing to payment confirmation message consumption.
- **PromQL Calculation:**
  ```promql
  histogram_quantile(0.95, sum(rate(payment_queue_consumer_lag_seconds_bucket[5m])) by (le))
  ```
- **Target:** $p95 \le 10\text{ s}$
- **Triggered Alert:** `QueueBacklog` fires if pending messages in `payment.order_created.queue` exceed 100 for more than 1 minute.

---

## 4. SLO Dashboard Reference

All three SLOs are continuously measured and visualized on Grafana:
- **Availability SLO & Latency SLO:** Featured on Dashboard **"RED & Golden Signals (Per Service)"** (`/d/red-metrics`)
- **Order Fulfillment & Consumer Lag:** Featured on Dashboard **"Business Flow & Asynchronous Pipeline"** (`/d/business-flow`)
