# Person B: SRE Incident Playbooks & Demo Narratives

This document defines the 4 core SRE investigation playbooks and live demonstration scripts for system reliability, observability, autoscaling, and resilience testing.

---

## Playbook 1: Downstream Latency Spike & Distributed Tracing

### Objective
Demonstrate how synthetic downstream latency propagates through the distributed system, how the Golden Signals (RED metrics) capture the degradation, and how Jaeger distributed tracing pinpoints the root cause in seconds.

### Prerequisites
- Services running locally or in Kubernetes.
- Prometheus & Grafana accessible at `http://localhost:3010`.
- Jaeger UI accessible at `http://localhost:16686`.

### Step-by-Step Execution

1. **Observe Baseline Metrics**:
   - Open Grafana **SRE - RED / Golden Signals** dashboard.
   - Run a baseline health probe:
     ```bash
     curl -i http://localhost:8080/api/v1/products
     ```
   - Baseline response time: ~10ms - 25ms.

2. **Inject Chaos Latency into Catalog Service**:
   - Inject 450ms artificial delay:
     ```bash
     node chaos/chaos_controller.js inject-latency catalog 450
     ```

3. **Generate Traffic**:
   - Send requests through the Gateway:
     ```bash
     node load/experiment_runner.js --concurrency 20 --duration 15 --endpoint http://localhost:8080/api/v1/products
     ```

4. **Verify in Dashboards & Distributed Tracing**:
   - **Grafana**: Observe `catalog_service` and gateway p95/p99 latency charts jump from ~20ms to ~470ms.
   - **Jaeger**: Navigate to `http://localhost:16686`:
     - Select Service: `order_service` or `catalog_service`.
     - Click **Find Traces**.
     - Open the latest trace: see the span `catalog_service` consuming 450ms+ of the total transaction duration, directly isolating the bottleneck.

5. **Remediation & Recovery**:
   - Reset chaos knobs to baseline:
     ```bash
     node chaos/chaos_controller.js reset catalog
     ```
   - Verify p95 latency returns to normal (< 30ms).

---

## Playbook 2: 1 → 1,000 Scaling Knee & HPA Autoscaling

### Objective
Identify the capacity limit ("scaling knee") of a single replica under escalating load, trigger Kubernetes Horizontal Pod Autoscaler (HPA) via CPU utilization, and verify latency recovery once replicas expand.

### Target Metrics
- **Load Range**: 1 → 10 → 100 → 500 → 1,000 concurrent requests.
- **Scaling Knee**: Point where p95 latency spikes > 2.5x baseline and throughput plateaus.
- **HPA Trigger**: Target 50% CPU threshold expands pods from 1 to up to 5 replicas.

### Step-by-Step Execution

1. **Deploy HPA & Pod Limits** (Kubernetes mode):
   ```bash
   kubectl apply -f k8s/hpa.yaml
   kubectl get hpa -n ecom
   ```

2. **Execute Graduated Concurrency Ramp**:
   - Run the experiment runner:
     ```bash
     node load/experiment_runner.js --stages 1,10,50,100,250,500,1000 --duration 12 --endpoint http://localhost:8080/api/v1/products --name scaling_knee_1k
     ```

3. **Identify Scaling Knee**:
   - Review output table:
     - 1 - 50 VUs: Sub-20ms latency, linear throughput increase.
     - 250 - 500 VUs: Throughput begins to plateau; queue time increases.
     - 1,000 VUs: Under single-replica, p99 latency spikes (Knee Identified).

4. **Trigger HPA Autoscaling via CPU Burn**:
   ```bash
   node chaos/chaos_controller.js burn-cpu catalog high
   ```
   - Watch HPA evaluate CPU and trigger scaling:
     ```bash
     kubectl get hpa -n ecom -w
     kubectl get pods -n ecom -l app=catalog
     ```
   - Verify pod count scales: `1 -> 2 -> 4 -> 5`.

5. **Validate Stabilized Concurrency at 1,000 VUs**:
   - Re-run 1k test against the scaled fleet:
     ```bash
     node load/experiment_runner.js --concurrency 1000 --duration 20 --endpoint http://localhost:8080/api/v1/products
     ```
   - Latency stabilizes and error rate remains < 0.5%.

6. **Reset**:
   ```bash
   node chaos/chaos_controller.js reset catalog
   ```

---

## Playbook 3: Cascade Failure Prevention & Circuit Breaker

### Objective
Demonstrate that when a downstream service experiences critical failure or 100% error rate, the upstream caller's circuit breaker trips to fast-fail or serve cached fallbacks, preserving system stability and triggering alertmanager notifications.

### Step-by-Step Execution

1. **Inject Downstream Outage into Catalog Service**:
   ```bash
   node chaos/chaos_controller.js inject-error catalog 1.0
   ```

2. **Trigger Upstream Dependency Requests**:
   - Attempt to place orders or fetch order validation:
     ```bash
     curl -i -X POST http://localhost:8080/api/v1/orders \
       -H "Content-Type: application/json" \
       -d '{"userId":"usr-test","items":[{"productId":"prod-1","quantity":1,"price":29.99}]}'
     ```

3. **Observe Circuit Breaker State Transition**:
   - Requests fail fast rather than hanging and consuming connection pools.
   - Check Prometheus metrics for circuit breaker state:
     - Metric: `circuit_breaker_state{name="catalog_client"}` transitions to `open`.

4. **Verify Alertmanager Notification**:
   - Open Alertmanager UI: `http://localhost:9093`.
   - Verify alert `HighErrorRate` or `ServiceDegraded` transitions to `FIRING`.

5. **Self-Healing & Circuit Breaker Reset**:
   - Heal catalog service:
     ```bash
     node chaos/chaos_controller.js reset catalog
     ```
   - Subsequent order requests succeed; circuit breaker closes (`closed`).

---

## Playbook 4: Queue Backpressure & Event-Driven Autoscaling (KEDA)

### Objective
Simulate consumer failure in an asynchronous message-driven architecture, observe message backlog accumulation in RabbitMQ, fire backlog alerts, and trigger KEDA to scale consumers to rapidly drain the queue.

### Step-by-Step Execution

1. **Stop Payment Consumer**:
   - Simulate worker crash by terminating the consumer process or setting consumer concurrency to 0.

2. **Generate Order Backlog**:
   - Inject 150 orders into the RabbitMQ `payment.order_created.queue`:
     ```bash
     node scripts/demo_queue_scaling.js 150
     ```

3. **Observe Backpressure in RabbitMQ & Grafana**:
   - RabbitMQ Management UI (`http://localhost:15672` user/pass: guest/guest):
     - Queue `payment.order_created.queue` message count surges to 150+.
   - Grafana **SRE - Business Flow & Messaging** dashboard:
     - Queue depth gauge turns orange/red.
     - Unprocessed message count rises.

4. **Observe KEDA Scaling Trigger**:
   - KEDA `ScaledObject` monitors queue depth threshold (target: 10 messages/pod).
   - In Kubernetes:
     ```bash
     kubectl get hpa -n ecom
     kubectl get pods -n ecom -l app=payment
     ```
   - KEDA expands payment worker replicas: `1 -> 3 -> 6`.

5. **Backlog Drainage**:
   - Restart the consumer or let scaled workers consume:
     ```bash
     node scripts/demo_queue_scaling.js consume
     ```
   - Queue depth rapidly drains back to 0.
   - KEDA scales replicas back down to minimum after cool-down period.
