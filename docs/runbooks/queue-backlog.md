# Runbook: QueueBacklog

## Alert Details
- **Alert Name:** `QueueBacklog`
- **Severity:** `warning`
- **Condition:** Pending ready messages in RabbitMQ queue `payment.order_created.queue` exceed 100 for $\ge 1\text{ minute}$.
- **PromQL:**
  ```promql
  (rabbitmq_queue_messages_ready{queue="payment.order_created.queue"} > 100) or (rabbitmq_queue_messages{queue="payment.order_created.queue"} > 100)
  ```

---

## 1. What This Alert Means
Customer orders are being placed and published to RabbitMQ faster than the Payment Service consumers can process them, or the Payment Service consumer loop has crashed / stalled. Orders are remaining in `PENDING_PAYMENT` state, breaching the Order Fulfillment SLO ($p95 \le 10\text{s}$).

---

## 2. Likely Causes by Architecture
- **Payment Consumer Offline:** Payment Service process was stopped, crashed, or disconnected its AMQP channel from RabbitMQ.
- **Upstream Order Surge (Traffic Spike):** Flash sale or sudden influx of order creations overwhelming the single consumer concurrency.
- **Slow Downstream Payment Processing:** Mock payment delays, slow database inserts into Payment DB, or network timeout delays.
- **Dead-Letter / Poison Pill Messages:** A malformed message causing consumer retries without unacknowledging.

---

## 3. Triage & Investigation Steps

### Step 1: Check Live Queue Depth in Grafana
Open Grafana **Business Flow Dashboard** (`http://localhost:3010/d/business-flow`):
- Check the **"Payment Order Queue Backlog"** stat card and **"RabbitMQ Queue Depth"** time-series chart.
- Note the rate of queue accumulation.

### Step 2: Check RabbitMQ Management UI
Open RabbitMQ Management UI at `http://localhost:15672` (Credentials: `guest` / `guest`):
- Navigate to **Queues** $\rightarrow$ `payment.order_created.queue`.
- Check if the queue has **0 active consumers** (indicating Payment consumer is down).
- Check **Unacked** message count.

### Step 3: Check Payment Service Consumer Logs
```bash
# Check if Payment Service consumer loop is logging processing events or errors:
docker logs -f ecom-payment --tail 100
```

---

## 4. Mitigation & Resolution
1. **If Consumer is Down:** Start or restart Payment Service immediately. Once online, it will automatically consume and drain pending messages.
2. **If Consumer is Overwhelmed:** Scale the number of consumer workers / replicas (or trigger Phase 3 KEDA auto-scaler).
3. **If Dead Letters / Poison Messages Exist:** Inspect `ecommerce.dead_letter_queue` in RabbitMQ management to isolate invalid payloads.
4. **Post-Incident:** Verify queue depth drops back to near 0 and the `QueueBacklog` alert clears.
