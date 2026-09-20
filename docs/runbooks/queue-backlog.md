# Runbook: QueueBacklog

## Alert Details
- **Alert Name:** `QueueBacklog`
- **Severity:** `Warning`
- **Threshold:** Queue depth > 100 messages for 1 minute.
- **PromQL:**
  ```promql
  rabbitmq_detailed_queue_messages > 100
  ```

---

## 1. Symptoms & Impact
- High number of unconsumed messages accumulating in RabbitMQ.
- In `payment.order_created.queue`: Customer orders remain stuck in `PENDING_PAYMENT` state without charging the customer or finalizing the transaction.
- In `order.payment_processed.queue` or `order.payment_failed.queue`: Order fulfillment state updates are delayed.
- Asynchronous Order Fulfillment SLO is breached.

---

## 2. Likely Causes
1. **Down or Crashed Consumer:** The downstream service consuming the queue (e.g. `payment-service` consuming `payment.order_created.queue`) has stopped running or crashed.
2. **Slow Consumer Processing / External API Latency:** Payment gateway simulation or database write latency is throttling message processing speed.
3. **Consumer Deadlock / Blocked Channel:** The AMQP channel connection was dropped without reconnecting.
4. **Traffic Surge:** Sudden burst of incoming orders exceeding single-replica processing capacity.

---

## 3. Triage & Investigation Steps

### Step 1: Identify Backlogged Queue
1. Open [SRE - Business Flow](http://localhost:3010/d/sre-business-flow/sre-business-flow) dashboard.
2. Look at the **RabbitMQ Queue Depth** panel to identify which queue is growing:
   - `payment.order_created.queue`
   - `order.payment_processed.queue`
   - `order.payment_failed.queue`
3. Inspect RabbitMQ Management UI:
   - URL: [http://localhost:15672/#/queues](http://localhost:15672/#/queues)
   - Credentials: `guest` / `guest`
   - Check "Consumers" count (should be ≥ 1). If 0, no consumer is attached!

### Step 2: Check Consumer Service Health
If `payment.order_created.queue` has high backlog:
```bash
# Check if payment service is healthy
curl -s http://localhost:3004/health
```

### Step 3: Check Consumer Lag Telemetry
Query consumer lag histogram in Prometheus:
```promql
histogram_quantile(0.95, sum(rate(payment_queue_consumer_lag_seconds_bucket[1m])) by (le))
```

---

## 4. Mitigation & Resolution
1. **If Consumer Count is 0 (Consumer Dead):**
   - Start or restart the consumer service immediately:
     ```bash
     npm run dev:payment
     ```
   - Watch the queue depth drain in real-time on Grafana.
2. **If Consumer Count is > 0 but Backlog Grows (Throughput Insufficient):**
   - Scale consumer worker processes or pods (in Phase 3, this triggers KEDA auto-scaling).
   - Verify database write performance and mock payment processing latency.
3. **Poison Messages / Dead Lettering:**
   - If specific messages repeatedly fail, ensure they are routed to Dead Letter Exchange (`dlx.events`) rather than infinitely requeuing.
4. **Verify Clearance:**
   - Once queue depth drops below 100, the alert will automatically resolve.
