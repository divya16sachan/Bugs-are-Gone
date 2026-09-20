# Load Testing Suite (Person B)

This directory provides high-concurrency performance and stress testing tooling designed to validate system stability, find the **scaling knee**, test **HPA/KEDA autoscaling**, and demonstrate resilience under load up to 1,000 concurrent requests.

---

## 1. High-Performance Experiment Runner (`experiment_runner.js`)

Zero external binaries required. Runs directly with Node.js and measures exact millisecond percentiles (p50, p90, p95, p99), requests per second (RPS), and error rates.

### Run Concurrency Ramp (1 → 1000)
```bash
# Default ramp: 1, 10, 50, 100, 250, 500, 1000 concurrency across stages
node load/experiment_runner.js

# Custom stages and endpoint
node load/experiment_runner.js --stages 10,100,500,1000 --duration 15 --endpoint http://localhost:8080/api/v1/products

# Test peak 1,000 concurrency directly
node load/experiment_runner.js --concurrency 1000 --duration 30 --endpoint http://localhost:8080/api/v1/products

# Test order checkout under concurrency
node load/experiment_runner.js --concurrency 500 --method POST --endpoint http://localhost:8080/api/v1/orders --payload '{"userId":"usr-load-1","items":[{"productId":"prod-1","quantity":1,"price":29.99}]}'
```

### Output Reports
Every run produces:
- `experiments/results/<experiment_name>_<timestamp>.json`
- `experiments/results/<experiment_name>_<timestamp>.csv`
- In-terminal ASCII table with scaling knee detection.

---

## 2. Standard k6 Script (`ramp_k6.js`)

If you have k6 installed or Docker available:

```bash
# Local k6
k6 run load/ramp_k6.js

# Via Docker
docker run --rm -i --network host -v ${PWD}/load:/load grafana/k6 run /load/ramp_k6.js
```
