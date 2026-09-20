# Runbook: ServiceDown

## Alert Details
- **Alert Name:** `ServiceDown`
- **Severity:** `Critical`
- **Threshold:** `up{job=~".*-service"} == 0` sustained for 30 seconds.
- **PromQL:**
  ```promql
  up{job=~".*-service"} == 0
  ```

---

## 1. Symptoms & Impact
- Total outage for the affected service component.
  - If `user-service` is down: Auth, signup, and login fail completely.
  - If `catalog-service` is down: Product search and inventory reservations fail.
  - If `order-service` is down: Checkouts fail.
  - If `payment-service` is down: Orders remain stuck in `PENDING_PAYMENT` state in RabbitMQ queues.
- PagerDuty / alert notifications are triggered immediately.

---

## 2. Likely Causes
1. **Process Crash (OOM / Unhandled Exception):** Process terminated unexpectedly due to memory exhaustion or uncaught error.
2. **Port Conflict or Network Partition:** Service unable to bind to port (e.g. 3001, 3002, 3003, 3004) or Docker host gateway unreachable.
3. **Database or Broker Startup Dependency:** Service exited on boot because Postgres or RabbitMQ was unavailable.

---

## 3. Triage & Investigation Steps

### Step 1: Identify Which Service is Down
Check the alert notification or Prometheus targets page:
- URL: [http://localhost:9090/targets](http://localhost:9090/targets)
- Note the `job` label (e.g., `user-service`, `catalog-service`, `order-service`, `payment-service`).

### Step 2: Check Process and Port Status
Run `lsof` or `ps` to see if the process is still running:
```bash
# Check port listening
lsof -i :3001 # User
lsof -i :3002 # Catalog
lsof -i :3003 # Order
lsof -i :3004 # Payment
```

### Step 3: Check Process Error Logs
Inspect the terminal where the service was started, or check system logs:
- Look for `Error: connect ECONNREFUSED`
- Look for Prisma migration or initialization crashes
- Look for Node.js `JavaScript heap out of memory`

---

## 4. Mitigation & Resolution
1. **Restart Service Immediately:**
   ```bash
   # In service workspace:
   npm run dev:<service> # e.g. npm run dev:payment
   ```
2. **Verify Dependencies:**
   Ensure PostgreSQL, Redis, and RabbitMQ are running and healthy:
   ```bash
   docker ps --filter "name=ecom-"
   ```
3. **Validate Recovery:**
   - Hit the service `/health` endpoint:
     ```bash
     curl -s http://localhost:300X/health
     ```
   - Confirm target status in Prometheus turns green (`UP`):
     ```bash
     curl -s http://localhost:9090/api/v1/targets | grep -A 2 -B 2 "service-name"
     ```
   - Alert will automatically resolve within 30 seconds.
