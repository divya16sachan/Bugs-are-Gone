# Service Level Objectives (SLOs)

This document specifies the core Service Level Objectives (SLOs), Service Level Indicators (SLIs), targets, and measurement PromQL expressions for the E-Commerce SRE Platform.

---

## 1. Overview Table

| SLO Name | Target | Measurement Window | Underlying Metric / Indicator | Severity if Breached |
|---|---|---|---|---|
| **API Availability** | ≥ 99.0% | Rolling 5 minutes | Ratio of non-5xx HTTP responses across all services | Warning / Critical |
| **API Latency (p95)** | < 1000 ms (1.0s) | Rolling 5 minutes | 95th percentile HTTP request duration | Warning |
| **Order Fulfillment Speed** | ≥ 95.0% within 10s | Rolling 15 minutes | End-to-end time from `OrderCreated` to terminal state (`COMPLETED` / `FAILED`) | Warning |

---

## 2. SLO 1: API Availability

### Description
Ensures that user-facing and inter-service HTTP requests succeed without unexpected server-side crashes (HTTP 5xx).

- **SLI Formula:**
  $$\text{Availability} = \frac{\sum \text{rate}(http\_requests\_total[5m]) - \sum \text{rate}(http\_requests\_total\{status\_code=\sim"5.." \}[5m])}{\sum \text{rate}(http\_requests\_total[5m])} \times 100$$

- **PromQL Expression:**
  ```promql
  (1 - (sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])))) * 100
  ```

- **Objective Target:** **≥ 99.0%**
- **Error Budget:** 1.0% of total requests over the measurement window.
- **Alert Trigger:** `HighErrorRate` alerts when error rate exceeds 5% for 2 minutes.

---

## 3. SLO 2: API Latency (p95)

### Description
Guarantees that 95% of customer interactions (catalog browsing, cart modifications, login, checkout initiation) complete in under 1 second.

- **SLI Formula:** 95th percentile of HTTP request duration histogram across all services.

- **PromQL Expression:**
  ```promql
  histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
  ```

- **Per-Service Expression:**
  ```promql
  histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))
  ```

- **Objective Target:** **< 1.00s (1000ms)**
- **Alert Trigger:** `HighLatency` alerts when p95 duration exceeds 1.0s for 2 minutes.

---

## 4. SLO 3: Asynchronous Order Fulfillment

### Description
Measures asynchronous processing performance. When a user submits an order, it must transition from `PENDING_PAYMENT` to a finalized state (`COMPLETED` or `FAILED`) within 10 seconds, without being trapped in RabbitMQ backlogs or delayed by slow consumers.

- **SLI Formula:**
  $$\text{Fulfillment Ratio} = \frac{\sum \text{rate}(payment\_transactions\_total[15m])}{\sum \text{rate}(orders\_created\_total[15m])} \times 100$$

- **PromQL Expression:**
  ```promql
  (sum(rate(payment_transactions_total[15m])) / sum(rate(orders_created_total[15m]))) * 100
  ```

- **Consumer Lag Indicator:**
  ```promql
  histogram_quantile(0.95, sum(rate(payment_queue_consumer_lag_seconds_bucket[5m])) by (le))
  ```

- **Objective Target:** **≥ 95.0%** of orders processed within 10 seconds.
- **Alert Trigger:** `QueueBacklog` alerts when queue depth exceeds 100 messages for 1 minute.

---

## 5. Dashboard Visualization

These SLOs are visualized live in Grafana:
- **Dashboard:** `SRE - RED / Golden Signals` (`http://localhost:3010/d/sre-red-signals/sre-red-golden-signals`)
- **Row:** `Service Level Objectives (SLOs)`
- **Panels:**
  - *Availability SLO (Target: ≥ 99%)* [Gauge]
  - *Latency p95 SLO (Target: < 1.0s)* [Gauge]
