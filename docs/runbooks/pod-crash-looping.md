# Runbook: PodCrashLooping

## Alert Details
- **Alert Name:** `PodCrashLooping`
- **Severity:** `Critical`
- **Threshold:** `kube_pod_container_status_waiting_reason{reason="CrashLoopBackOff"} == 1` sustained for 1 minute.
- **PromQL:**
  ```promql
  kube_pod_container_status_waiting_reason{reason="CrashLoopBackOff"} == 1
  ```

---

## 1. Symptoms & Impact
- A Kubernetes pod container is continually failing, exiting, and being restarted by the kubelet with exponential backoff delay.
- The service capacity is degraded or completely unavailable if all pod replicas enter crash looping.
- Dependent microservices and ingress requests will experience connection refused, HTTP 502 Bad Gateway, or HTTP 503 Service Unavailable errors.

---

## 2. Likely Causes
1. **Application Runtime Crash / Uncaught Exception on Boot:**
   - Missing or invalid environment variable (e.g., `DATABASE_URL`, `RABBITMQ_URL`, `JWT_SECRET`).
   - Failed database migrations or schema incompatibility.
2. **Resource Starvation (OOMKilled):**
   - Container exceeded its assigned memory limit (`resources.limits.memory`).
3. **Failing Liveness / Readiness Probes:**
   - The probe endpoint (`/health`) is timing out or returning non-2xx status codes during startup.
4. **Port Binding Conflict / Permission Error:**
   - Container process failed to bind to its configured port or lacks filesystem permissions.

---

## 3. Triage & Investigation Steps

### Step 1: Identify the Failing Pod & Namespace
Check the alert labels or query Prometheus / Grafana:
- Grafana Dashboard: [SRE - Kubernetes Health](http://localhost:3010/d/sre-kubernetes-health/sre-kubernetes-health)
- Inspect the **Pod Restarts** and **Pod Status** panels.
- Target labels: `{{ $labels.namespace }}` and `{{ $labels.pod }}`.

### Step 2: Inspect Kubernetes Pod State & Events
Run `kubectl describe` to inspect the exit code, termination reason, and event history:
```bash
kubectl describe pod <pod-name> -n <namespace>
```
Look for:
- `Last State: Terminated`
- `Reason: Error` or `Reason: OOMKilled`
- `Exit Code: 1` (application error) or `Exit Code: 137` (SIGKILL / OOM)
- Events log at the bottom of the describe output.

### Step 3: Inspect Container Crash Logs
Retrieve the stdout/stderr logs from the previous failed container instance:
```bash
kubectl logs <pod-name> -n <namespace> --previous
```
If the container is actively restarting, stream current logs:
```bash
kubectl logs -f <pod-name> -n <namespace>
```

---

## 4. Mitigation & Resolution

1. **If Exit Code is 137 (OOMKilled):**
   - Increase the memory limit in the deployment manifest:
     ```yaml
     resources:
       limits:
         memory: "512Mi" # Increase appropriately
     ```
2. **If Exit Code is 1 (App / Configuration Error):**
   - Verify ConfigMaps and Secrets are properly mounted.
   - Check database connection strings and verify that Postgres/Redis/RabbitMQ are reachable from the pod network.
3. **If Probes are Failing:**
   - Adjust `initialDelaySeconds` or `failureThreshold` on the liveness probe to allow sufficient startup time:
     ```yaml
     livenessProbe:
       httpGet:
         path: /health
         port: 300X
       initialDelaySeconds: 15
       periodSeconds: 10
     ```
4. **Verify Recovery:**
   - Check pod status:
     ```bash
     kubectl get pods -n <namespace> -w
     ```
   - Once all replicas report `Running` and `Ready: 1/1`, the alert will automatically resolve within 1 minute.
