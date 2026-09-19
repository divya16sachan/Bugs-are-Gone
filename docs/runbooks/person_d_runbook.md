# Person D Runbook: Platform & Delivery — The Scaling Machinery

> **Role:** Person D (Platform & Delivery)  
> **Core Objective:** Provide the scalable Kubernetes infrastructure, ensure node capacity for the 1000-user ramp, wire HPA and KEDA queue-depth autoscaling, automate the Jenkins CI/CD delivery pipeline, and demonstrate zero-downtime auto-rollbacks.

---

## 1. Architecture Overview

```
                   +-----------------------------------------------+
                   |              Jenkins CI/CD Pipeline           |
                   |  Lint -> Test -> Build (Git SHA) -> Deploy    |
                   |    -> Smoke Test -> Auto-Rollback on Failure  |
                   +-----------------------+-----------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
|                               Local Kubernetes Cluster (kind)                           |
|  [control-plane] (Port mappings 30001-30004, 30080)                                    |
|  [worker-1]      (Node capacity for 1000-user ramp)                                     |
|  [worker-2]      (Multi-replica pod distribution)                                       |
+-----------------------------------------------------------------------------------------+
| Namespace: ecom                                                                         |
|                                                                                         |
|  +--------------------+   +----------------------+   +-------------------------------+  |
|  | User Service (3001)|   | Catalog Service(3002)|   | Order Service (3003)          |  |
|  | [HPA: 1-10 @ 70%]  |   | [HPA: 1-10 @ 70%]    |   | [HPA: 1-10 @ 70%]             |  |
|  +--------------------+   +----------------------+   +-------------------------------+  |
|                                                                                         |
|  +-----------------------------------------------------------------------------------+  |
|  | Payment Service (3004)                                                            |  |
|  |  • CPU HPA: 1-10 replicas @ 70% CPU                                               |  |
|  |  • KEDA ScaledObject: RabbitMQ 'payment.order_created.queue' backlog > 10 msgs    |  |
|  +-----------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Day-by-Day Implementation Summary

| Day | Scope | Deliverables |
|---|---|---|
| **Day 1** | Local Cluster & Skeleton | `k8s/kind-config.yaml` (3-node cluster), `k8s/services/hello-world/`, manifest templates in `k8s/services/_template/`. |
| **Day 2** | Local Infra & Pipeline Start | `docker-compose.yml` (Grafana port 3010 to prevent frontend conflict), `Jenkinsfile` scaffolded against hello-world. |
| **Day 3** | K8s Manifests & Base Configs | `k8s/base/` (Namespace, ConfigMap, Secret), Per-service Deployments, Services, and HPAs with exact resource bounds and probes. |
| **Day 4** | Automated Rollback Pipeline | Finished `Jenkinsfile` with Git SHA tagging, post-deploy `/health` smoke-test, and automatic `kubectl rollout undo` recovery. |
| **Day 5** | Integration & KEDA Scaling | Kustomize root (`k8s/kustomization.yaml`), KEDA `ScaledObject` & `TriggerAuthentication` for RabbitMQ queue depth. |
| **Day 6** | Capacity Sizing & Load Prep | Multi-worker node capacity configuration for 1000-user ramp, HPA stabilization tuning. |
| **Day 7** | Live Demonstrations | Scaling demo script (`demo_hpa_scaling.js`), queue scaling script (`demo_queue_scaling.js`), and bad-deploy rollback demo (`demo_bad_deploy_rollback.sh`/`.ps1`). |

---

## 3. Operational Procedures

### 3.1 Standing Up the Kubernetes Cluster
Run the helper script to create the 3-node kind cluster and apply all manifests:

**Linux / Mac / Git Bash:**
```bash
./scripts/cluster_up.sh
```

**Windows PowerShell:**
```powershell
.\scripts\cluster_up.ps1
```

Verify the cluster and pods:
```bash
kubectl get nodes -o wide
kubectl get pods,svc,hpa -n ecom
```

---

### 3.2 Running the Jenkins CI/CD Pipeline
The pipeline is defined in [Jenkinsfile](file:///c:/Users/Shreyam/OneDrive/Desktop/devops/Bugs-are-Gone/Jenkinsfile) and performs:
1. **Lint & Typecheck**: Validates shared libraries and services.
2. **Unit Tests**: Runs service test suites.
3. **Build & Tag**: Builds Docker images tagged by Git commit SHA (`git-${GIT_SHA_SHORT}`).
4. **Deploy**: Deploys manifests to Kubernetes namespace `ecom`.
5. **Smoke Test**: Queries `/health` endpoints.
6. **Auto-Rollback**: If `/health` fails, automatically runs `kubectl rollout undo` to revert to the last working revision.

---

### 3.3 Demonstrating HPA CPU Scaling (Load Ramp)
In Terminal 1, watch HPA and pod replicas expand:
```bash
kubectl get hpa,pods -n ecom -w
```

In Terminal 2, run the load loop:
```bash
node scripts/demo_hpa_scaling.js http://localhost:30001/health 50 60
```
**Expected Outcome:**
- CPU utilization climbs above the 70% threshold.
- HPA triggers replica expansion (e.g. from 1 pod to 4-8 pods).
- Once load ceases, HPA safely scales down following the configured cooldown stabilization window.

---

### 3.4 Demonstrating KEDA Queue-Depth Autoscaling
In Terminal 1, monitor KEDA ScaledObjects and payment pods:
```bash
kubectl get scaledobject,hpa,pods -l app=payment-service -n ecom -w
```

In Terminal 2, inject a message backlog:
```bash
node scripts/demo_queue_scaling.js 150
```
**Expected Outcome:**
- Message count in `payment.order_created.queue` exceeds target (10 messages).
- KEDA detects the backlog and instructs the HPA to scale up `payment-service-deployment` replicas to drain the queue.

---

### 3.5 Demonstrating Bad-Deploy Self-Healing Auto-Rollback
Run the automated demonstration script:

**Linux / Git Bash:**
```bash
./scripts/demo_bad_deploy_rollback.sh
```

**Windows PowerShell:**
```powershell
.\scripts\demo_bad_deploy_rollback.ps1
```

**Demonstration Sequence:**
1. Confirms current healthy revision.
2. Applies a faulty image (`ecom-user-service:broken-v999`).
3. Observes rollout stalling/failing due to readiness check failure.
4. Pipeline / script catches failure and executes `kubectl rollout undo deployment/user-service-deployment -n ecom`.
5. Verifies previous stable revision is restored without manual human intervention.

---

### 3.6 Cluster Teardown
```bash
# Bash
./scripts/cluster_down.sh

# PowerShell
.\scripts\cluster_down.ps1
```
