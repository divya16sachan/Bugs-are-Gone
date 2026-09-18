# Scalable E-Commerce SRE System

A distributed microservices architecture designed to demonstrate **observability (RED metrics & Prometheus), self-healing (circuit breakers, retries, DLQ), and auto-scaling (Kubernetes HPA & KEDA)**.

---

## 🚀 Quickstart: How to Run

### 1. Prerequisites
- **Node.js**: v20+ (LTS)
- **Docker & Docker Compose**: v24+

### 2. Setup & Installation
```bash
# Clone the repository
git clone <repo-url>
cd Bugs-are-Gone

# Install all workspace dependencies
npm install

# Build shared libraries
npm --workspace=@ecom/shared run build
```

### 3. Start Infrastructure Containers
```bash
docker compose up -d
```
This launches:
- **PostgreSQL 15** (`localhost:5432` — initialized with `user_db`, `catalog_db`, `order_db`, `payment_db`)
- **Redis 7** (`localhost:6379`)
- **RabbitMQ 3 Management** (AMQP `5672`, UI `http://localhost:15672`, Metrics `http://localhost:15692`)
- **Prometheus** (`http://localhost:9090`)
- **Grafana** (`http://localhost:3000` — admin/admin)
- **Alertmanager** (`http://localhost:9093`)

### 4. Start Microservices
Run each service in separate terminals (or concurrently):
```bash
# User Service (Port 3001)
npm run dev:user

# Catalog Service (Port 3002)
npm run dev:catalog

# Order Service (Port 3003)
npm run dev:order

# Payment Service (Port 3004)
npm run dev:payment
```

### 5. Verify Health & Metrics
```bash
# Run automated smoke test
npm run smoke-test
```
Or check individually in your browser/curl:
- User Service: `http://localhost:3001/health` & `http://localhost:3001/metrics`
- Catalog Service: `http://localhost:3002/health` & `http://localhost:3002/metrics`
- Order Service: `http://localhost:3003/health` & `http://localhost:3003/metrics`
- Payment Service: `http://localhost:3004/health` & `http://localhost:3004/metrics`

---


## 0. Tech Stack Decision (locking this in before Step 0)

| Concern | Choice | Why |
|---|---|---|
| Runtime | Node.js (LTS) + TypeScript | Type safety across contract boundaries |
| Web framework | Fastify | Faster than Express, built-in schema validation, better under load |
| ORM | Prisma | Clean migrations, good DX, works well with Postgres |
| Cache | **Redis** | Product cache (cache-aside pattern), nothing else |
| Message broker | **RabbitMQ** (not BullMQ) | See reasoning below |
| Queue/job library | `amqplib` (raw) or `@golevelup/nestjs-rabbitmq`-style wrapper | Direct control over exchanges/routing/DLQ |
| Metrics | `prom-client` | Standard Prometheus client for Node |
| Container orchestration | Kubernetes (kind locally → real cloud later) | Needed for HPA (Step 3) |

### Why RabbitMQ over BullMQ
Both are valid, but they solve different problems:
- **BullMQ** is a Redis-backed *job queue* — great for background tasks inside a single app (e.g. "resize this image later"), and it's easy for a Node-only team.
- **RabbitMQ** is a *real message broker* — topic exchanges, routing keys, per-consumer queues, native dead-letter queues, and a management UI that exposes **queue depth as a Prometheus metric out of the box**.

Since your whole project's point is **monitoring + self-healing + auto-scaling**, and one of your headline demos is "queue depth climbs → alert fires → system scales consumers" — you need a broker built for that observability story. RabbitMQ gives it natively. BullMQ would make you hand-roll queue-depth metrics yourself, and it would also share Redis with your cache — mixing a job queue and a cache on the same Redis instance is exactly the kind of resource-contention problem SRE teams try to avoid. Keep them separate:

- **Redis → caching only**
- **RabbitMQ → all cross-service events**

This also matches how real production event-driven systems are usually built, so it's a more honest "scalable system" story.

---

## 1. The Five Steps — Roadmap Overview

| Step | What Happens | Depends On |
|---|---|---|
| **Step 0** (now) | Folder structure, shared conventions, docker-compose skeleton, contracts placeholder | — |
| **Step 1** | Build actual services (User, Catalog, Order, Payment) with real logic against the contract | Step 0 structure |
| **Step 2** | Monitoring stack — Prometheus, Grafana, Alertmanager, dashboards, alert rules | Every service already emits `/metrics` (built in Step 1) |
| **Step 3** | Auto-scaling — Kubernetes HPA per service, scaling on CPU + custom metrics (e.g. queue depth) | Step 2 metrics must exist for custom-metric scaling to work |
| **Step 4** | Self-healing — circuit breakers, retries, DLQ, auto-rollback on bad deploys | Step 1 services + Step 2 monitoring (to detect what needs healing) + Step 3 (scaling reacts to health) |

**Why this order matters:** you can't auto-scale on a metric that doesn't exist yet (Step 3 needs Step 2), and self-healing logic is much easier to verify with dashboards already in place (Step 4 needs Step 2). Step 0 has to lay groundwork for all of this now, even though none of it is built yet.

---

## 2. STEP 0 — Detailed Instructions (execute now)

### 2.1 What Step 0 must anticipate for later steps
- **For Step 1:** every service folder must be identical in shape, so business logic can be dropped in without restructuring
- **For Step 2:** every service must already have a `/metrics` and `/health` route stub (even returning fake data), and `docker-compose.yml` must already include Prometheus + Grafana containers, even if empty/unconfigured
- **For Step 3:** k8s manifest templates (Deployment/Service/HPA) must exist as placeholders from day one, even before any service is containerized for real
- **For Step 4:** each service must have a dedicated `resilience/` folder and a `chaos/` folder from the start, so nobody has to retrofit self-healing code into an already-built service later

### 2.2 Folder structure

```
ecom-sre/
├── README.md
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json
│
├── backend/
│   ├── CONTRACTS.md
│   ├── services/
│   │   ├── user/
│   │   ├── catalog/
│   │   ├── order/
│   │   └── payment/
│   └── shared/
│       ├── metrics/
│       ├── logger/
│       └── types/
│
├── monitoring/
│   ├── prometheus/prometheus.yml
│   ├── grafana/dashboards/
│   ├── grafana/provisioning/
│   ├── alertmanager/alertmanager.yml
│   └── rules/
│
├── k8s/
│   ├── base/
│   └── services/
│       └── _template/          # placeholder Deployment/Service/HPA, copied per service in Step 3
│
├── scripts/
│   ├── load_test.js
│   ├── chaos.js
│   └── smoke_test.js
│
├── .github/workflows/
│
└── docs/
    └── runbooks/
```

### 2.3 Per-service skeleton (identical for all four)

```
services/<name>/
├── package.json
├── tsconfig.json
├── Dockerfile
├── .env.example
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── config.ts
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── events/
│   │   ├── publisher.ts         # RabbitMQ publish wrapper
│   │   └── consumer.ts          # RabbitMQ consume wrapper
│   ├── mocks/                   # mocked dependencies on OTHER services
│   ├── middleware/
│   │   ├── metrics.middleware.ts
│   │   └── errorHandler.ts
│   ├── health/health.ts
│   └── resilience/              # <- exists NOW, filled in Step 4
│       ├── circuitBreaker.ts
│       ├── retry.ts
│       └── timeout.ts
├── tests/
└── chaos/
    └── inject.ts                # exists NOW, filled in Step 4
```

### 2.4 `docker-compose.yml` — what to include now
Even though Steps 2–4 aren't built yet, the compose file should define all containers now so nobody has to touch shared infra config later:
- `postgres:15`
- `redis:7`
- `rabbitmq:3-management` (Prometheus plugin enabled)
- `prometheus` (pointed at an empty/placeholder scrape config)
- `grafana` (no dashboards yet, just running)

### 2.5 `CONTRACTS.md` — skeleton sections to freeze now
- Ports table (all 4 services + infra)
- JWT payload shape + shared secret env var name
- HTTP endpoint list per service (method, path, request/response shape)
- RabbitMQ exchange name, routing keys, queue names, DLQ name
- Prometheus metric names per service (RED metrics + service-specific ones)
- Docker image naming convention

### 2.6 Step 0 exit criteria (don't move to Step 1 until these pass)
- [ ] `docker-compose up` brings up Postgres, Redis, RabbitMQ, Prometheus, Grafana with no errors
- [ ] All four service folders scaffolded identically, each runs `npm run dev` and responds on `/health` and `/metrics` with stub data
- [ ] `CONTRACTS.md` filled in and frozen — no further solo edits after this point
- [ ] k8s template folder exists (unused for now, but present)
- [ ] Everyone on the team can clone the repo and get their own service running without needing anyone else's code

---

## 3. Step 1 Preview — Creating the Services
*(detailed instructions will come once Step 0 is verified — noting here only what Step 0 must not block)*
- Real Prisma schema + migrations per service's own DB
- Real business logic in `controllers/` and `services/`
- Real RabbitMQ publish/consume wired into `events/`
- Mocks in `mocks/` used until integration day

## 4. Step 2 Preview — Monitoring
- Prometheus scrape configs pointed at real `/metrics` from all 4 services
- 3 Grafana dashboards: RED/golden signals, K8s health, business flow (orders/payments/queue depth)
- Alert rules: HighErrorRate, HighLatency, QueueBacklog, PodCrashLooping, ServiceDown

## 5. Step 3 Preview — Auto-Scaling
- HPA per service scaling on CPU
- Payment service scaling additionally on **RabbitMQ queue depth** (via KEDA or Prometheus Adapter, since vanilla k8s HPA can't read custom Prometheus metrics directly — worth deciding this in Step 3, not now)
- `load_test.js` used to trigger scale-up, observe scale-down after load drops

## 6. Step 4 Preview — Self-Healing
- Circuit breaker on Order → Catalog calls
- Retry with backoff on RabbitMQ publish
- Dead-letter queue wired for repeatedly-failing messages
- Auto-rollback in deploy pipeline on failed post-deploy health check
- Chaos scripts trigger real failures to prove the healing works, tied to Step 2's dashboards/alerts

---

## 7. One Thing to Decide Before Step 3 (flag now, act later)
Vanilla Kubernetes HPA only scales on CPU/memory by default. To scale on **queue depth** (your backpressure demo), you'll need either:
- **KEDA** (Kubernetes Event-Driven Autoscaling) — purpose-built for scaling on RabbitMQ queue length, simplest option, OR
- **Prometheus Adapter** — exposes Prometheus metrics as custom metrics API for HPA, more manual setup

Recommendation: **KEDA**, since it has a native RabbitMQ scaler and is far less config than Prometheus Adapter. No action needed now — just don't forget this when you reach Step 3.
