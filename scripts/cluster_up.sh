#!/usr/bin/env bash
# ==============================================================================
# Person D — Local Kind Kubernetes Cluster Setup Script
# ==============================================================================

set -e

CLUSTER_NAME="ecom-sre-cluster"

echo "=========================================================="
echo "🚀 Standing up local kind cluster: ${CLUSTER_NAME}"
echo "=========================================================="

if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
    echo "Cluster '${CLUSTER_NAME}' already exists."
else
    echo "Creating multi-node kind cluster from k8s/kind-config.yaml..."
    kind create cluster --config k8s/kind-config.yaml
fi

echo -e "\n[Step 1] Applying Kubernetes Base Configurations (Namespace, ConfigMap, Secrets)..."
kubectl apply -k k8s/base

echo -e "\n[Step 2] Applying Microservices Manifests & HPA..."
kubectl apply -k k8s/

echo -e "\n[Step 3] Cluster status:"
kubectl get nodes -o wide
kubectl get pods,svc,hpa -n ecom

echo -e "\n=========================================================="
echo "✅ Local Kubernetes Cluster is ready for Person D scaling & delivery!"
echo "=========================================================="
