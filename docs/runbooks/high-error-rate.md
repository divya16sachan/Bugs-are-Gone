# Runbook: HighErrorRate

## Alert Details
- **Alert Name:** `HighErrorRate`
- **Severity:** `warning`
- **Condition:** 5xx HTTP response rate exceeds 5% of total traffic over a 5-minute window for $\ge 2\text{ minutes}$.
- **PromQL:**
  ```promql
  sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service) > 0.05
  ```

---

## 1. What This Alert Means
A microservice is returning internal server errors (HTTP 500, 502, 503, or 504) for more than 5% of incoming client requests. This indicates either an unhandled application exception, database connection failure, downstream dependency timeout, or resource exhaustion.

---

## 2. Likely Causes by Architecture
- **User Service:** PostgreSQL connectivity error, invalid JWT secret or salt configuration, database connection pool exhaustion.
- **Catalog Service:** Redis connection timeout / failure, PostgreSQL database query errors, unhandled product search exceptions.
- **Order Service:** Catalog service HTTP timeout during price verification, PostgreSQL lock contention during order creation, RabbitMQ publish failure.
- **Payment Service:** Payment mock failure cascade, database insertion failure for payment records, webhook processing error.

---

## 3. Triage & Investigation Steps

### Step 1: Identify the Affected Service & Route
Open Grafana **RED & Golden Signals Dashboard** (`http://localhost:3010/d/red-metrics`) and check the **"5xx Server Error Rate by Route"** panel to isolate which endpoint and HTTP route is failing.

### Step 2: Check Service Logs
Inspect the live console output / Docker logs of the failing service:
```bash
# Example for order service
docker logs -f ecom-order --tail 100
# Or inspect local process stdout
```

### Step 3: Check Dependent Infrastructure Health
Verify the supporting infrastructure is healthy:
- **Postgres:** `docker exec -it ecom-postgres pg_isready -U postgres`
- **Redis:** `docker exec -it ecom-redis redis-cli ping`
- **RabbitMQ:** `docker exec -it ecom-rabbitmq rabbitmq-diagnostics check_port_connectivity`

---

## 4. Mitigation & Resolution
1. **Database / Redis connectivity failure:** Restart or unfreeze the affected database/cache container (`docker compose restart postgres` / `redis`).
2. **Unhandled code exception / bug:** Roll back the bad commit or apply hotfix to address unhandled Promise rejections.
3. **Downstream service timeout:** Check if dependent microservices (e.g. Catalog service called by Order service) are degraded or overloaded.
4. **Post-Incident:** Verify error rate falls below 1% and alert clears automatically.
