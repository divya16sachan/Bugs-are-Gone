# Phase 3 — Load Testing, Chaos Engineering & SRE Reliability Experiments (Person B)

> **Context for the agent:** Phase 0 (infra scaffolding), Phase 1 (microservices & business logic), and Phase 2 (observability, Prometheus metrics, and Grafana dashboards) are complete. This phase implements **Person B's mission — the intellectual core of the SRE project**: high-concurrency load generation (1 → 1,000 requests), dynamic fault injection, chaos scripts, capacity saturation ("scaling knee") analysis, and reproducible incident investigation playbooks.

---

## 0. What Already Works (Inherited Foundations)
- **4 Microservices running with real infra**: User (`3001`), Catalog (`3002`), Order (`3003`), Payment (`3004`).
- **Nginx API Gateway**: Listening on `http://localhost:8080`, reverse proxying to backend services.
- **Monitoring & Observability**: Prometheus (`9090`), Grafana (`3010`), Alertmanager (`9093`), Jaeger/Tempo tracing, and RabbitMQ metrics (`15692`).
- **Autoscaling definitions**: Kubernetes CPU-based HPA manifests and KEDA RabbitMQ queue-depth autoscalers (`k8s/autoscaling/`).

---

## 1. Fault-Injection Layer & Dynamic Chaos Controls (`@ecom/shared`)

Every microservice must support runtime incident simulation without requiring service restarts or source code edits.

### 1.1 Knobs & Parameters
- `INJECT_LATENCY_MS` (integer): Injects synthetic asynchronous delay on incoming non-health requests.
- `INJECT_ERROR_RATE` (float, 0.0 - 1.0): Randomly injects HTTP 500 responses based on probability.
- `CPU_WORK` (`none` | `low` | `medium` | `high`): Executes cryptographic SHA-256 rounds to burn CPU deterministically and trigger HPA CPU utilization thresholds.

### 1.2 Endpoints (Exposed on all microservices)
- `GET /chaos/config`: Inspects current fault injection settings.
- `POST /chaos/inject`: Updates fault injection settings dynamically in memory (`{ injectLatencyMs, injectErrorRate, cpuWork }`).
- `POST /chaos/reset`: Restores all knobs back to clean baseline (`0ms`, `0.0` error rate, `none` CPU).

### 1.3 Service Integration
Registered in `app.ts` across all 4 microservices:
```ts
import { createChaosPlugin } from "@ecom/shared";
await app.register(createChaosPlugin(config.serviceName));
```

---

## 2. High-Concurrency Load Testing Suite (`load/`)

Validates platform stability and capacity under real load scaling from 1 to 1,000 concurrent requests.

### 2.1 Native Node.js Experiment Runner (`load/experiment_runner.js`)
Zero external binary dependencies. Uses native HTTP keep-alive connection pooling with high connection limits (`maxSockets: 2000`).
- **Multi-stage Ramping**: Steps through `1 → 10 → 50 → 100 → 250 → 500 → 1,000` concurrent virtual workers.
- **Percentile Calculation**: Accurately computes p50, p90, p95, and p99 request duration in milliseconds.
- **RED Metrics**: Reports Requests Per Second (RPS), total requests, client 4xx, and server 5xx error percentages.
- **Scaling Knee Detection**: Detects capacity knee where latency increases by > 2.5x baseline or error rate exceeds 2%.
- **Reporting**: Automatically writes timestamped JSON and CSV benchmark reports to `experiments/results/`.

### 2.2 Standard k6 Script (`load/ramp_k6.js`)
Multi-stage k6 script testing real user journeys (catalog browse, product detail, checkout order creation) with strict SLO thresholds:
- `http_req_duration`: p95 < 1000ms.
- `http_req_failed`: error rate < 5%.

---

## 3. Chaos Engineering Suite (`chaos/`)

Enables live fault injection and infrastructure resilience experiments.

### 3.1 Unified Chaos Controller CLI (`chaos/chaos_controller.js`)
Unified CLI tool to control chaos across all services:
```bash
# Check status and health across all services
node chaos/chaos_controller.js status

# Inject 350ms latency into Catalog
node chaos/chaos_controller.js inject-latency catalog 350

# Inject 40% error rate into Catalog
node chaos/chaos_controller.js inject-error catalog 0.4

# Burn CPU in Catalog to drive HPA autoscaling
node chaos/chaos_controller.js burn-cpu catalog high

# Reset all services to healthy baseline
node chaos/chaos_controller.js reset
```

### 3.2 Kubernetes Pod Termination (`chaos/kill_pod.ps1` & `kill_pod.sh`)
Automated scripts to target microservice pods in Kubernetes (`kubectl delete pod -l app=<service> -n ecom --force`) and observe self-healing replacement pods.

---

## 4. SRE Investigation Playbooks (`experiments/`)

Authoritative runbooks and automated runners for the 4 core SRE demonstration scenarios:

### Playbook 1: Downstream Latency Spike & Distributed Tracing
- **Action**: Inject 400ms delay into Catalog service.
- **Observation**: p95 latency spike visible in Grafana *RED Signals* dashboard; root cause isolated to Catalog span in Jaeger distributed tracing (`http://localhost:16686`).
- **Recovery**: Reset chaos; latency returns to < 25ms.

### Playbook 2: 1 → 1,000 Scaling Knee & HPA Autoscaling
- **Action**: Ramp load from 1 to 1,000 concurrent workers via `load/experiment_runner.js`.
- **Observation**: Identify single-replica saturation point; inject CPU burn; observe Kubernetes HPA expanding pods from 1 to 5 replicas; latency stabilizes under 1,000 peak concurrency.

### Playbook 3: Cascade Failure Prevention & Circuit Breakers
- **Action**: Inject 100% error rate into Catalog service.
- **Observation**: Order service circuit breaker (`opossum`) trips to open state; fails fast to prevent connection exhaustion; Alertmanager triggers `HighErrorRate` alert.
- **Recovery**: Reset Catalog service; circuit breaker transitions back to closed state.

### Playbook 4: Queue Backpressure & Event-Driven Autoscaling (KEDA)
- **Action**: Stop Payment consumer; burst 150+ orders into RabbitMQ.
- **Observation**: Message backlog accumulates in `payment.order_created.queue`; queue depth alert fires; KEDA ScaledObject scales payment workers up to drain the queue.

### 4.1 Automated Incident Runner (`experiments/run_scenario.js`)
Execute scenarios end-to-end via CLI:
```bash
node experiments/run_scenario.js 1    # Latency & Tracing
node experiments/run_scenario.js 2    # Scaling Knee & 1k Load
node experiments/run_scenario.js 3    # Circuit Breaker & Cascade Outage
node experiments/run_scenario.js 4    # Queue Backpressure & KEDA
node experiments/run_scenario.js all  # Run all scenarios sequentially
```

---

## 5. Gateway Tuning for 1k Concurrency & Load Balancing (`gateway/nginx.conf`)

Tuned Nginx configuration to support 1,000+ concurrent requests without dropped connections or socket starvation:
- `upstream` blocks with `least_conn` load balancing across replicas.
- `keepalive 128` connection pooling between gateway and upstream services.
- `proxy_http_version 1.1` and `Connection ""` headers for HTTP connection reuse.
- Optimized proxy buffer sizes (`client_body_buffer_size 128k`, `proxy_buffers 32 16k`).

---

## 6. Verification & Validation Deliverables

### Benchmark Results: 1,000 Concurrent Requests
- **Command**: `node load/experiment_runner.js --concurrency 1000 --duration 5 --endpoint http://localhost:8080/health`
- **Output**:
  - Total requests: **17,420**
  - Throughput: **3,342.3 RPS**
  - Error rate: **0.0%**
  - p50: **210ms** | p95: **1184ms** | p99: **2175ms**
  - No socket exhaustion or dropped connections.

### TypeScript Compilation
- `npm run typecheck`: Passed cleanly across all workspaces (`@ecom/shared`, `user-service`, `catalog-service`, `order-service`, `payment-service`).
