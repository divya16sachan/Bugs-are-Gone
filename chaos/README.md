# Chaos Engineering Suite (Person B)

This suite enables dynamic fault injection and resilience testing without restarting services or modifying application code.

---

## 1. Unified Chaos Controller CLI (`chaos_controller.js`)

Manage chaos knobs live across all services (`user:3001`, `catalog:3002`, `order:3003`, `payment:3004`).

### Commands

#### Check Chaos Knobs & Health Status
```bash
node chaos/chaos_controller.js status
```

#### Inject Synthetic Latency
Simulates slow network, heavy DB queries, or slow downstream dependencies.
```bash
# Add 350ms delay to all non-health requests in catalog service
node chaos/chaos_controller.js inject-latency catalog 350

# Add 500ms delay to order service
node chaos/chaos_controller.js inject-latency order 500
```

#### Inject Synthetic HTTP 500 Errors
Simulates intermittent or hard failures to test circuit breakers, retries, and error alerts.
```bash
# Inject 30% error rate in catalog service
node chaos/chaos_controller.js inject-error catalog 0.3

# Inject 100% outage in catalog service to trip Order service circuit breaker
node chaos/chaos_controller.js inject-error catalog 1.0
```

#### Inject CPU Burn (HPA Stress)
Calculates CPU-intensive SHA-256 cycles to drive CPU utilization and trigger Kubernetes HPA autoscaling.
```bash
# Burn levels: low | medium | high
node chaos/chaos_controller.js burn-cpu catalog high

# Turn off CPU burn
node chaos/chaos_controller.js burn-cpu catalog none
```

#### Reset to Baseline
Restores all services or a specific service back to normal operating conditions.
```bash
# Reset all microservices
node chaos/chaos_controller.js reset

# Reset single service
node chaos/chaos_controller.js reset catalog
```

---

## 2. Kubernetes Pod Crash Testing (`kill_pod.ps1` / `kill_pod.sh`)

Simulates container failure, OOM kills, or node termination in Kubernetes.

```powershell
# PowerShell (Windows)
.\chaos\kill_pod.ps1 -Service catalog -Namespace ecom
```

```bash
# Bash (Linux/macOS)
./chaos/kill_pod.sh catalog ecom
```
