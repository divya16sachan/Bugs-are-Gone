# E-Commerce SRE Project — Implementation Plan for Coding Agent

> **Context for the agent:** You have no prior knowledge of this project. Read this entire document before writing any code. This is a college/learning project whose real purpose is NOT the e-commerce functionality — it's demonstrating **monitoring, self-healing, and auto-scaling** in a distributed system. The e-commerce app is just the vehicle to demonstrate these SRE concepts.

---

## 1. Project Overview

We are building a small e-commerce backend made of 4 independent microservices, built by a 4-person team, but you are being asked to scaffold it for one person working in Node.js. The business logic is intentionally simple. The engineering focus is:

1. **Monitoring** — every service exposes health and metrics; dashboards and alerts detect problems in real time
2. **Self-healing** — the system survives failures gracefully (circuit breakers, retries, dead-letter queues, auto-rollback) instead of cascading into a full outage
3. **Auto-scaling** — services scale up under load and scale back down when load drops, including scaling on custom signals like queue depth, not just CPU

The 4 services:
- **User** — signup/login, issues JWTs
- **Catalog** — product listing + stock, Redis-cached
- **Order** — receives orders, validates JWT, calls Catalog to reserve stock, publishes an event for Payment to process
- **Payment** — consumes order events asynchronously, processes payment (with a small artificial failure rate for testing resilience), publishes the result back

Services never call each other's internal code — they only communicate through a frozen contract (HTTP APIs + message events), so each can be built and tested in isolation.

---

## 2. Tech Stack (locked in — do not deviate without asking)

| Concern | Choice |
|---|---|
| Runtime | Node.js (LTS) + TypeScript |
| Web framework | Fastify |
| ORM | Prisma |
| Database | PostgreSQL 15 (one database per service — no shared DB) |
| Cache | Redis 7 — **used only for caching**, nothing else |
| Message broker | RabbitMQ 3 (management image) — **used for all cross-service events**, not Redis/BullMQ |
| Metrics | `prom-client` (Prometheus exposition format) |
| Monitoring stack | Prometheus + Grafana + Alertmanager |
| Container orchestration | Kubernetes (start with local `kind`, can move to real cloud later) |
| Auto-scaling on custom metrics (e.g. queue depth) | KEDA (decide/implement in the auto-scaling phase, not now) |
| Containerization | Docker, one Dockerfile per service |

**Why RabbitMQ instead of BullMQ:** the project's core demo is "queue depth rises → alert fires → system scales up." RabbitMQ exposes queue depth as a native Prometheus metric via its management plugin. BullMQ is Redis-based and would compete with the cache for the same Redis instance — keep caching and messaging on separate systems.

---

## 3. The Full Roadmap (5 phases)

Build in this order. Do not skip ahead — each phase depends on groundwork from the one before it.

| Phase | Name | What Happens |
|---|---|---|
| **0** | Folder & Infra Scaffolding | Repo structure, shared conventions, docker-compose, contract skeleton — **this is the current task** |
| **1** | Build the Services | Real business logic in all 4 services against the frozen contract |
| **2** | Monitoring | Prometheus, Grafana dashboards, Alertmanager rules — depends on every service already emitting `/metrics` from Phase 0/1 |
| **3** | Auto-Scaling | Kubernetes HPA per service, KEDA for queue-depth-based scaling — depends on Phase 2 metrics existing |
| **4** | Self-Healing | Circuit breakers, retries, dead-letter queues, auto-rollback on failed deploys — depends on Phase 2 (to observe healing) and Phase 3 (scaling reacts to health) |

**Because later phases depend on earlier scaffolding, Phase 0 must build placeholders for things it doesn't implement yet** — e.g. empty `resilience/` folders per service (used in Phase 4), a Kubernetes manifest template (used in Phase 3), and Prometheus/Grafana containers already present in `docker-compose.yml` even before there's anything real to monitor.

---

## 4. YOUR TASK: Phase 0 — Folder & Infra Scaffolding

This is the only phase to execute right now. Do not write business logic. Do not implement monitoring, scaling, or healing logic yet — only create the placeholder folders/files for them as specified below.

### 4.1 Root folder structure to create

```
ecom-sre/
├── CONTRACTS.md
├── README.md
├── docker-compose.yml
├── .env.example
│
├── services/
│   ├── user/
│   ├── catalog/
│   ├── order/
│   └── payment/
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
│       └── _template/
│
├── scripts/
│   ├── load_test.js
│   ├── chaos.js
│   └── smoke_test.js
│
├── shared/
│   ├── metrics/
│   ├── logger/
│   └── types/
│
├── .github/
│   └── workflows/
│
└── docs/
    └── runbooks/
```

### 4.2 Per-service internal structure (identical for all 4 services)

```
services/<name>/
├── package.json
├── tsconfig.json
├── Dockerfile
├── .env.example
├── src/
│   ├── index.ts               # entrypoint
│   ├── app.ts                 # Fastify app setup
│   ├── config.ts              # env var loading/validation
│   ├── routes/
│   ├── controllers/
│   ├── services/              # business logic, internal only
│   ├── models/                # this service's own Prisma schema/models
│   ├── events/
│   │   ├── publisher.ts       # RabbitMQ publish wrapper
│   │   └── consumer.ts        # RabbitMQ consume wrapper
│   ├── mocks/                 # mocks of OTHER services this one depends on
│   ├── middleware/
│   │   ├── metrics.middleware.ts
│   │   └── errorHandler.ts
│   ├── health/
│   │   └── health.ts
│   └── resilience/            # EMPTY for now — filled in Phase 4
│       ├── circuitBreaker.ts
│       ├── retry.ts
│       └── timeout.ts
├── tests/
└── chaos/
    └── inject.ts               # EMPTY for now — filled in Phase 4
```

> The `resilience/` and `chaos/` folders should exist with minimal placeholder files (e.g. a file with just a comment `// implemented in Phase 4`) — do not leave the folders empty (git won't track empty folders), but do not implement real logic in them yet.

### 4.3 `shared/` folder rules
This is the only place code can be reused across services. It must contain only generic infrastructure code:
- `shared/metrics/` — a reusable `prom-client` wrapper that any service can import to get RED metrics middleware (`http_requests_total`, `http_request_duration_seconds`) with a `service` label
- `shared/logger/` — a basic structured logger config (e.g. wrapping `pino`, which pairs well with Fastify)
- `shared/types/` — optional shared TypeScript interfaces for contract shapes (e.g. JWT payload shape)

Never put business logic or one service's models here.

### 4.4 `docker-compose.yml` — what to define now
Define all of the following containers now, even though most won't be configured until later phases:
- `postgres:15` — one instance is fine for local dev; each service connects to its own database name within it
- `redis:7`
- `rabbitmq:3-management` — enable the Prometheus plugin (`rabbitmq_prometheus`)
- `prometheus` — pointed at an empty/placeholder scrape config file for now
- `grafana` — running with no dashboards provisioned yet

### 4.5 `CONTRACTS.md` — sections to create now (fill in as you scaffold)
Create the file with these section headers, and fill in what's already decided:

- **Ports** — table of every service + infra component and its port
- **Auth** — JWT payload shape (`sub`, `email`), shared secret env var name (`JWT_SECRET`), algorithm (HS256)
- **HTTP APIs** — one subsection per service listing method, path, request body, response body, status codes
- **Events** — RabbitMQ exchange name (`ecommerce`, topic exchange), each event name + payload shape + which queue it lands in, plus the dead-letter queue name
- **Prometheus metric names** — RED metrics common to all services, plus any service-specific ones (leave placeholders like `TBD` for ones not yet decided — these get finalized before Phase 1 starts for real)
- **Docker image naming convention** — `<dockerhub-user>/ecom-<service>:<git-sha>`

### 4.6 `k8s/services/_template/`
Create placeholder (non-functional yet) files: `deployment.yaml`, `service.yaml`, `hpa.yaml`. These will be copied and filled in per service during Phase 3. For now they can contain minimal boilerplate with `# TODO: Phase 3` comments — do not write real scaling logic yet.

### 4.7 `scripts/`
Create `load_test.js`, `chaos.js`, `smoke_test.js` as empty files with a top-of-file comment describing their future purpose (Phase 3 for load_test, Phase 4 for chaos, Phase 1 for smoke_test). No implementation yet.

### 4.8 Root `.env.example`
List every environment variable that will eventually be needed across all services and infra (`JWT_SECRET`, `DATABASE_URL` per service, `REDIS_URL`, `RABBITMQ_URL`, ports, etc.) even if some aren't used until later phases.

---

## 5. Phase 0 Exit Criteria — verify before reporting done

- [ ] `docker-compose up` brings up Postgres, Redis, RabbitMQ, Prometheus, and Grafana with no errors
- [ ] All four service folders are scaffolded identically per section 4.2
- [ ] Each service runs (`npm install && npm run dev`) and responds on `/health` (200 with stub JSON) and `/metrics` (Prometheus-format stub output) independently of the others
- [ ] `CONTRACTS.md` exists with all section headers from 4.5, filled in wherever the information is already known
- [ ] `k8s/services/_template/` exists with placeholder manifests
- [ ] `shared/metrics/` and `shared/logger/` exist and are actually imported and working in at least one service, to prove the pattern works
- [ ] No service folder imports code from another service folder — only from `shared/`

---

## 6. What NOT to do in this phase
- Do not implement real signup/login/order/payment logic
- Do not write real circuit breakers, retries, or chaos injection logic
- Do not configure real Grafana dashboards or Prometheus alert rules
- Do not write real Kubernetes HPA scaling rules
- Do not add BullMQ or use Redis for anything other than caching

Once Phase 0's exit criteria are met, stop and report back — Phase 1 instructions will be provided separately.
