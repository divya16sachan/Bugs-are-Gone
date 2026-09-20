# Auto-Scaling Specifications (HPA & KEDA)

## Overview
This directory documents the **Auto-Scaling Architecture** prepared for the E-Commerce SRE platform, aligning **Person C's Observability** layer with Kubernetes auto-scalers.

The platform employs two complementary scaling strategies:
1. **CPU-based Horizontal Pod Autoscaler (HPA):** For synchronous HTTP services (`user-service`, `catalog-service`, `order-service`).
2. **Event-Driven Autoscaler (KEDA):** For asynchronous queue-consuming workers (`payment-service`).

---

## 1. Strategy A: CPU-based HPA

- **Target Services:** `user-service`, `catalog-service`, `order-service`
- **Metric:** CPU Utilization (`averageUtilization: 70%`)
- **Scaling Range:** `minReplicas: 1`, `maxReplicas: 10`
- **Template Manifest:** `k8s/services/_template/hpa.yaml`
- **Observability Panels (Grafana Dashboard 2 - SRE Kubernetes Health):**
  - *HPA Current vs Desired Replicas*
  - *HPA CPU Utilization vs Target (70%)*

---

## 2. Strategy B: RabbitMQ Queue-based Autoscaling (KEDA)

Vanilla Kubernetes HPA cannot scale directly on RabbitMQ queue depth. We use **KEDA (Kubernetes Event-Driven Autoscaling)**:

- **Target Service:** `payment-service-deployment`
- **Target Queue:** `payment.order_created.queue`
- **Scaling Trigger:** Queue depth ≥ **30 messages**
- **Scaling Range:** `minReplicas: 1`, `maxReplicas: 10`
- **Polling Interval:** 5 seconds (rapid responsiveness to traffic spikes)
- **Cooldown Period:** 30 seconds (stabilization before scale-down)
- **Manifest:** `k8s/autoscaling/payment-keda-scaler.yaml`
- **Observability Panel (Grafana Dashboard 2 - SRE Kubernetes Health):**
  - *KEDA Event-Driven Scaling: Queue Depth vs Scale Trigger*

---

## 3. Scale-Up & Scale-Down Life Cycle

```
Traffic Spike / Load Test (Person B)
       │
       ▼
RabbitMQ Backlog Grows: payment.order_created.queue > 30 msgs
       │
       ├─► Prometheus Alert: QueueBacklog (warning at > 100 msgs)
       │
       └─► KEDA Scaler detects backlog > 30 msgs
              │
              ▼
       Scale-Up: payment-service replicas 1 ──► 3 ──► 6
              │
              ▼
       Queue Drains: Backlog drops < 30 msgs
              │
              ▼
       Cooldown Period: 30s stabilization
              │
              ▼
       Scale-Down: payment-service replicas 6 ──► 3 ──► 1
```

---

## 4. How to Deploy to Kind Cluster

When ready to apply in the Kind cluster:
```bash
# 1. Install KEDA in Kind (if not already installed)
helm repo add kedacore https://kedacore.github.io/charts
helm repo update
helm install keda kedacore/keda --namespace keda --create-namespace

# 2. Apply Payment Scaler
kubectl apply -f k8s/autoscaling/payment-keda-scaler.yaml

# 3. Verify ScaledObject
kubectl get scaledobject -A
```
