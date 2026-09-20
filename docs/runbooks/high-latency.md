# Runbook: HighLatency

## Alert Details
- **Alert Name:** `HighLatency`
- **Severity:** `Warning`
- **Threshold:** p95 HTTP request duration > 1.0s (1000ms) over 5 minutes, sustained for 2 minutes.
- **PromQL:**
  ```promql
  histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (service, le)) > 1
  ```

---

## 1. Symptoms & Impact
- Page loads, API calls, and catalog queries feel sluggish.
- Potential cascading timeouts if callers have tight HTTP request deadlines.
- Latency SLO (p95 < 1s) is breached.

---

## 2. Likely Causes
1. **Unindexed / Slow Database Queries:** Complex Prisma queries without proper DB indexes under load.
2. **Redis Cache Miss Storm:** If cache is cold, expired, or evicting keys, heavy database queries will saturate Postgres.
3. **Event Loop Starvation (Node.js):** CPU-intensive tasks (JSON serialization, bcrypt hashing) blocking the single-threaded Node.js event loop.
4. **Network / Socket Resource Exhaustion:** HTTP connection pool saturation between services.

---

## 3. Triage & Investigation Steps

### Step 1: Identify Slow Service & Route
1. Open the [SRE - RED / Golden Signals](http://localhost:3010/d/sre-red-signals/sre-red-golden-signals) dashboard.
2. Inspect the **p95 Latency** and **p99 Latency** panels to pinpoint which service is slowest.
3. Query Prometheus to find the specific slow routes:
   ```promql
   histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (route, le))
   ```

### Step 2: Check Node.js Event Loop Lag
Query Node.js internal telemetry:
```promql
nodejs_nodejs_eventloop_lag_p95_seconds
```
If lag is high (> 100ms), Node.js is CPU-bound on synchronous tasks.

### Step 3: Check Redis Cache Performance
Open [SRE - Business Flow](http://localhost:3010/d/sre-business-flow/sre-business-flow):
- Look at **Catalog Cache Hit Ratio** gauge.
- If hit ratio is below 50%, examine Redis key eviction or connection errors.

---

## 4. Mitigation & Resolution
1. **Scale Consumers / Service Instances:** Scale out additional replicas (or prepare HPA in Phase 3).
2. **Warm Cache:** Re-prime high-traffic product listings in Redis.
3. **Database Connection Tuning:** Increase `connection_limit` in Prisma database URL connection strings if queries are waiting on pool availability.
4. **Temporary Rate Limiting:** If incoming traffic spikes beyond capacity, apply temporary throttling at NGINX API Gateway (`localhost:8080`).
