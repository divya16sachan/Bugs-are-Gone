# Runbook: HighErrorRate

## Alert Details
- **Alert Name:** `HighErrorRate`
- **Severity:** `Warning`
- **Threshold:** 5xx error rate > 5% of total requests over 5 minutes, sustained for 2 minutes.
- **PromQL:**
  ```promql
  sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service) > 0.05
  ```

---

## 1. Symptoms & Impact
- Client requests are receiving `500 Internal Server Error`, `502 Bad Gateway`, or `503 Service Unavailable`.
- Users cannot complete authentication, catalog search, or order checkout.
- Availability SLO (≥ 99%) error budget is actively burning.

---

## 2. Likely Causes
1. **Database Unavailability or Exhaustion:** PostgreSQL connection pool exhaustion or query timeout in `user-service`, `catalog-service`, or `order-service`.
2. **Upstream / Dependency Failure:** Gateway or intermediate service unable to reach a dependent service.
3. **Unhandled Exception / Bug:** Code regression or unhandled runtime rejection thrown in Express request handler.
4. **Redis Cache Crash:** If Redis is down, cache fallback might fail if error handling is incomplete.

---

## 3. Triage & Investigation Steps

### Step 1: Identify Affected Service
Check the Prometheus Alert or Grafana RED Signals dashboard to see which `$labels.service` is alerting:
- Dashboard: [SRE - RED / Golden Signals](http://localhost:3010/d/sre-red-signals/sre-red-golden-signals)
- Filter by `service` and view the "Error Rate %" panel.

### Step 2: Check Service Health
Run the health check endpoint for the failing service:
```bash
# Example for User Service
curl -i http://localhost:3001/health

# Example for Catalog Service
curl -i http://localhost:3002/health

# Example for Order Service
curl -i http://localhost:3003/health

# Example for Payment Service
curl -i http://localhost:3004/health
```

### Step 3: Inspect Service Logs
Check the terminal stdout or container logs of the offending service:
```bash
# If running in Docker
docker logs --tail 100 -f ecom-<service>

# Check PostgreSQL connection status
docker exec -it ecom-postgres pg_isready -U postgres
```

---

## 4. Mitigation & Resolution
1. **Restart Unhealthy Service:** If the service is deadlocked or in an unrecoverable state:
   - Terminate the host process and restart (`npm run dev:<service>`).
2. **Database Recovery:**
   - Verify PostgreSQL is accepting connections on `5432`.
   - If PostgreSQL is down: `docker compose restart postgres`.
3. **Roll Back Degraded Code:** If errors started immediately following a new commit or deployment, roll back to the previous stable release.
4. **Verify Clearance:** Confirm on `http://localhost:9090/alerts` that `HighErrorRate` resolves from `firing` to green.
