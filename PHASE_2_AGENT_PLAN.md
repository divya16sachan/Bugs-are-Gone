# Phase 2 — Monitoring Implementation Plan (for Antigravity Agent)

> **Context for the agent:** Phase 0 (infra scaffolding) and Phase 1 (business logic) are complete and verified end-to-end — signup, login, product browsing, order creation, and async payment processing all work through the gateway at `localhost:8080`. All 4 services already emit real Prometheus metrics on `/metrics` (RED metrics + custom counters like `orders_created_total`, `catalog_cache_hits_total`, `payment_transactions_total`, etc.). Prometheus is already scraping all 4 services successfully (confirmed via `/targets` showing all UP). This phase turns that raw metric data into dashboards, alerts, and runbooks — the actual observability layer of the project.

---

## 0. What Already Works (do not redo)
- `docker-compose.yml` already runs Prometheus (`9090`), Grafana (`3010`), Alertmanager (`9093`), and RabbitMQ with its Prometheus plugin (`15692`)
- `monitoring/prometheus/prometheus.yml` already scrapes all 4 services via `host.docker.internal:300X`
- `monitoring/grafana/provisioning/datasources/datasource.yml` already provisions Prometheus as a Grafana datasource
- All 4 services already emit real (non-stub) metrics

## 1. First — Verify the RabbitMQ Metric Names

The contract assumed a metric name (`rabbitmq_queue_messages`), but the actual RabbitMQ Prometheus plugin may expose it differently (with `vhost`/`queue` labels, or a different name entirely). Before building any dashboard or alert around queue depth, confirm the real metric name:

```bash
curl -s http://localhost:15692/metrics | grep -i queue_messages
```

Update `backend/CONTRACTS.md` section 5 with whatever the actual metric name and labels turn out to be (likely something like `rabbitmq_queue_messages_ready{queue="...",vhost="..."}`), and use that exact name everywhere below — don't build against the assumed name if it doesn't match.

---

## 2. Grafana Dashboards (3 total)

Build each as a dashboard JSON file under `monitoring/grafana/dashboards/`, and provision them automatically via `monitoring/grafana/provisioning/dashboards/dashboards.yml` (a provider config pointing at that folder) — so dashboards load on `docker compose up` with no manual import.

### 2.1 Dashboard 1 — RED / Golden Signals (per service)
One panel row per service (User, Catalog, Order, Payment), each showing:
- **Rate:** `sum(rate(http_requests_total{service="$service"}[1m])) by (route)`
- **Errors:** `sum(rate(http_requests_total{service="$service", status_code=~"5.."}[1m]))`
- **Duration (p95):** `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service="$service"}[5m])) by (le))`

Add a Grafana template variable `$service` (query: `label_values(http_requests_total, service)`) so the dashboard works as one reusable view, not 4 separate ones.

### 2.2 Dashboard 2 — Business Flow
- **Orders created (rate):** `rate(orders_created_total[5m])`
- **Order processing duration (p95):** from `order_processing_duration_seconds`
- **Payment success vs failure rate:** `sum(rate(payment_transactions_total[5m])) by (status)`
- **Catalog cache hit ratio:** `rate(catalog_cache_hits_total[5m]) / (rate(catalog_cache_hits_total[5m]) + rate(catalog_cache_misses_total[5m]))`
- **RabbitMQ queue depth:** using the real metric name confirmed in section 1, one panel per queue (`payment.order_created.queue`, `order.payment_processed.queue`, `order.payment_failed.queue`)
- **User signups / logins:** `rate(user_signups_total[5m])`, `sum(rate(user_logins_total[5m])) by (status)`

This dashboard is the one that will visually carry the backpressure and cascade demos in Phase 3/4 — queue depth and payment success rate are the two panels to make most prominent.

### 2.3 Dashboard 3 — Infrastructure Health
- **Service up/down:** `up{job=~".*-service"}` as a stat panel per service (green/red)
- **RabbitMQ:** connection count, unacked messages, using whatever RabbitMQ exporter metrics are available (`curl localhost:15692/metrics | grep rabbitmq_` to see what's exposed)
- **Postgres/Redis:** these aren't scraped directly yet (no postgres_exporter/redis_exporter in the stack) — for Phase 2, skip dedicated DB-level panels and rely on each service's own `/health` check result surfaced via a simple panel querying `up{job="..."}`. Don't add new exporters in this phase; that's a Phase 4 (self-healing observability) concern if needed.

---

## 3. Alertmanager Rules

Add real rule definitions in `monitoring/rules/` (referenced by `monitoring/prometheus/prometheus.yml`'s `rule_files` section — confirm this is wired, since Phase 0 only created the empty folder).

### 3.1 Rules to implement

```yaml
groups:
  - name: ecom-alerts
    rules:
      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service) > 0.05
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "{{ $labels.service }} error rate above 5%"

      - alert: HighLatency
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (service, le)) > 1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "{{ $labels.service }} p95 latency above 1s"

      - alert: ServiceDown
        expr: up{job=~".*-service"} == 0
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: "{{ $labels.job }} is down"

      - alert: QueueBacklog
        expr: <real_rabbitmq_metric_name_from_section_1> > 100
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Queue {{ $labels.queue }} backlog above 100 messages"
```

`PodCrashLooping` from the original brief is **not implemented in this phase** — it requires Kubernetes (Phase 3), since there are no pods yet. Add it when containerization happens.

### 3.2 Alertmanager routing
`monitoring/alertmanager/alertmanager.yml` needs a real receiver — right now it's likely an empty/placeholder config. For a student project with no real Slack workspace, use one of these (agent should ask which, if unclear):
- A free **webhook.site** URL as a receiver, so fired alerts are visible in a browser during demos (simplest, no setup)
- A real Slack incoming webhook, if one exists for this project

Wire whichever is chosen into a `receiver` block and route all `severity: critical`/`warning` alerts to it.

---

## 4. SLOs (2–3, simple)

Add a short section to `backend/CONTRACTS.md` or a new `docs/SLOs.md`:
1. **Availability:** 99% of requests return non-5xx across a rolling 5-minute window
2. **Latency:** p95 request duration under 1 second for all services
3. **Order fulfillment:** 95% of orders reach `COMPLETED` or `FAILED` (not stuck in `PENDING_PAYMENT`) within 10 seconds of creation

Add a small SLO panel to Dashboard 1 showing current values against these targets.

---

## 5. Runbooks

One short markdown file per alert under `docs/runbooks/`, replacing the empty `.gitkeep`:
- `docs/runbooks/high-error-rate.md`
- `docs/runbooks/high-latency.md`
- `docs/runbooks/service-down.md`
- `docs/runbooks/queue-backlog.md`

Each should be short: what the alert means, likely causes given this system's architecture (e.g. for `QueueBacklog`: "Payment service may be down or processing slowly — check its `/health` and consider scaling consumers"), and first steps to check.

---

## 6. Verification — Trigger Every Alert For Real

Don't just confirm the rules parse — prove each one fires:

- **ServiceDown:** stop the Payment service process, confirm the alert fires within ~30-60s, confirm it clears once restarted
- **HighErrorRate:** hit a nonexistent endpoint repeatedly (`for i in {1..50}; do curl -s http://localhost:8080/api/v1/nonexistent; done`) or trigger 5xx some other way, confirm alert fires
- **QueueBacklog:** stop the Payment service (so `order.created` messages pile up), then create several orders in a loop to push queue depth over 100, confirm alert fires, then restart Payment and confirm the queue drains and alert clears
- **HighLatency:** harder to trigger without artificial delay — acceptable to verify the query syntax is valid and returns data, without necessarily forcing it over threshold in Phase 2 (real latency injection is more of a Phase 4 chaos-testing concern)

## 7. Exit Criteria
- [ ] Real RabbitMQ metric name confirmed and used consistently across dashboards/alerts (not the assumed placeholder name)
- [ ] All 3 Grafana dashboards load automatically on `docker compose up` (provisioned, not manually imported) and show real, non-empty data
- [ ] All 4 alert rules load into Prometheus (`http://localhost:9090/alerts` shows them, not just in the rules file)
- [ ] ServiceDown and QueueBacklog alerts both verified to actually fire and clear, per section 6
- [ ] Alertmanager has a working receiver (webhook or Slack) — fired alerts are actually visible somewhere, not just present in Prometheus's internal state
- [ ] Runbooks exist for all 4 alerts
- [ ] SLOs documented and reflected in at least one dashboard panel

Do not proceed to Phase 3 (auto-scaling) until QueueBacklog is confirmed working end-to-end — Phase 3's KEDA setup depends directly on this metric being real and alert-worthy.
