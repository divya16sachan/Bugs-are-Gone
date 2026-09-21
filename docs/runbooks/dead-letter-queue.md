# Runbook: DeadLetterQueueGrowing

## Alert Details
- **Alert Name:** `DeadLetterQueueGrowing`
- **Severity:** `warning`
- **Condition:** Pending ready messages in `ecommerce.dead_letter_queue` exceed 0 for $\ge 1\text{ minute}$.
- **PromQL:**
  ```promql
  rabbitmq_queue_messages_ready{queue="ecommerce.dead_letter_queue"} > 0
  ```

---

## 1. What This Alert Means
Messages sent across the RabbitMQ event pipeline have failed processing repeatedly, exceeded consumer retry limits or TTLs, or were explicitly rejected (`nack`/`reject` with `requeue=false`) and routed to the Dead-Letter Exchange (`ecommerce.dlx`).

---

## 2. Likely Causes
- **Malformed Message Payload:** Schema violation, missing required fields (e.g. invalid `orderId` or negative `amount`), or JSON syntax errors.
- **Uncaught Consumer Exception:** Application logic failure in Payment or Order consumer causing unhandled rejection during processing.
- **Stale / Poison Pill Events:** Events referencing deleted user or product records that fail database foreign key constraints.

---

## 3. Triage & Investigation Steps

### Step 1: Check Message Count and Details in RabbitMQ Management
Open the RabbitMQ Management UI (`http://localhost:15672`, credentials: `guest`/`guest`):
- Navigate to **Queues** $\rightarrow$ `ecommerce.dead_letter_queue`.
- Inspect the queue length and look at the **x-death** header on dead-lettered messages to identify the original routing key and reason for rejection.

### Step 2: Check Service Logs Around Failure Time
Search the logs of Payment Service or Order Service for processing errors:
```bash
docker logs --tail 200 ecom-payment
docker logs --tail 200 ecom-order
```

---

## 4. Mitigation & Resolution
1. **Fix Payload / Bug:** If a code bug caused rejection, deploy the fix to the consumer service.
2. **Requeue or Purge:** Once the root cause is resolved, re-publish valid messages to the original queue or purge poison pills from the DLQ.
3. **Alert Resolution:** Verify `ecommerce.dead_letter_queue` message count returns to 0 and the alert clears.
