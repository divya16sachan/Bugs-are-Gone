# Runbook: ServiceDown

## Alert Details
- **Alert Name:** `ServiceDown`
- **Severity:** `critical`
- **Condition:** A Prometheus scrape target is reporting `up == 0` for $\ge 30\text{ seconds}$.
- **PromQL:**
  ```promql
  up{job=~".*-service"} == 0
  ```

---

## 1. What This Alert Means
One of the core microservices (`user-service`, `catalog-service`, `order-service`, or `payment-service`) is completely unreachable, crashed, terminated, or failing to respond to HTTP health/metrics requests.

---

## 2. Likely Causes by Architecture
- **Process Crash:** Uncaught exception, Out-Of-Memory (OOM) killer terminating Node.js process, or fatal unhandled rejection.
- **Port Conflict / Network Partition:** Port binding failure on startup, or network disconnection between Prometheus container and host process (`host.docker.internal`).
- **Dependency Startup Hang:** Service hanging while attempting to establish connection to PostgreSQL, Redis, or RabbitMQ without proper connection timeout.

---

## 3. Triage & Investigation Steps

### Step 1: Identify Which Service is Down
Check Grafana **Infrastructure Health Dashboard** (`http://localhost:3010/d/infra-health`) or the Grafana **Alerting UI** (`http://localhost:3010/alerting/list`):
- The failing service will appear with a red `DOWN` status.

### Step 2: Check Process Status and Exit Code
If running locally:
```bash
# Check if the process is running on the corresponding port:
# User (3001), Catalog (3002), Order (3003), Payment (3004)
netstat -ano | findstr :300
```
Or check Docker container state if containerized:
```bash
docker ps -a
docker logs --tail 50 <container_name>
```

### Step 3: Test Health Endpoint Manually
From the command line, send an HTTP request to the service health check:
```bash
# Example for User Service:
curl -i http://localhost:3001/health
```

---

## 4. Mitigation & Resolution
1. **Restart the Service:** Restart the service process or container immediately to restore availability.
   ```bash
   # Example restarting service:
   npm run start --workspace=@ecom/<service-name>
   ```
2. **Examine Crash Logs:** Inspect stack trace prior to termination to identify memory leaks or uncaught errors.
3. **Verify Up State:** Confirm the `up` metric transitions to `1` in Prometheus within 15 seconds.
4. **Alert Resolution:** Verify the `[RESOLVED]` notification arrives at Webhook.site / Alertmanager.
