# Runbook: HighLatency

## Alert Details
- **Alert Name:** `HighLatency`
- **Severity:** `warning`
- **Condition:** 95th percentile (p95) HTTP request latency exceeds 1.0 second over a 5-minute window for $\ge 2\text{ minutes}$.
- **PromQL:**
  ```promql
  histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (service, le)) > 1
  ```

---

## 1. What This Alert Means
At least 5% of incoming customer requests are taking longer than 1 second to complete. This breaches the Latency SLO ($p95 < 1.0\text{s}$) and leads to degraded user experience, slow page loads on the frontend, and potential HTTP gateway timeout cascades.

---

## 2. Likely Causes by Architecture
- **Catalog Service:** Redis cache misses leading to repeated unindexed Postgres queries, cache eviction storm, slow LIKE queries on product names.
- **Order Service:** Synchronous REST calls to Catalog Service (`/api/v1/catalog/products/:id`) experiencing high latency or network delay.
- **Database Layer:** Heavy lock contention, unindexed tables, high connection pool wait times, or disk I/O bottleneck.
- **Node.js Process:** High event loop lag (`nodejs_eventloop_lag_seconds`), CPU starvation, or garbage collection pauses.

---

## 3. Triage & Investigation Steps

### Step 1: Pinpoint the Slow Endpoints
Open Grafana **RED & Golden Signals Dashboard** (`http://localhost:3010/d/red-metrics`) and view the **"p95 Latency by Endpoint"** and **"Latency Quantiles (p50, p90, p95, p99)"** panels.

### Step 2: Check Redis Cache Performance (for Catalog Service)
Open Grafana **Business Flow Dashboard** (`http://localhost:3010/d/business-flow`):
- Check the **"Redis Catalog Cache Hits vs Misses"** panel.
- If Cache Hit Ratio is low, verify Redis connectivity and cache TTL settings.

### Step 3: Check Event Loop Lag and Memory
Open Grafana **Infrastructure Health Dashboard** (`http://localhost:3010/d/infra-health`):
- Check **"Node.js Event Loop Lag"** and **"Node.js Heap Memory Used"**.
- If event loop lag is $> 100\text{ms}$, investigate synchronous CPU-heavy code blocks or JSON parsing bottlenecks.

---

## 4. Mitigation & Resolution
1. **Cache Repopulation:** Pre-warm the Redis cache if a cache flush caused a thundering herd on Postgres.
2. **Database Query Optimization:** Check for missing indexes or slow query locks (`SELECT * FROM pg_stat_activity;`).
3. **Scaling:** Increase service process replicas (or configure HPA in Phase 3) to distribute high traffic load.
4. **Post-Incident:** Ensure p95 latency returns under $0.5\text{s}$ and the alert automatically resolves in Prometheus and Alertmanager.
