#!/usr/bin/env bash
# ==============================================================================
# Person D — Bad Deployment & Self-Healing Auto-Rollback Demo
# ==============================================================================

set -e

NAMESPACE="ecom"
TARGET="${1:-}"

if [ -z "$TARGET" ]; then
    if kubectl get deployment user-service-deployment -n "$NAMESPACE" &>/dev/null; then
        TARGET="user-service"
    elif kubectl get deployment hello-world-deployment -n "$NAMESPACE" &>/dev/null; then
        TARGET="hello-world"
    else
        TARGET="user-service"
    fi
fi

if [ "$TARGET" = "hello-world" ]; then
    DEPLOYMENT="hello-world-deployment"
    CONTAINER="hello-world"
    BAD_IMAGE="ecom-hello-world:broken-v999"
    APP_LABEL="hello-world"
else
    DEPLOYMENT="user-service-deployment"
    CONTAINER="user-service"
    BAD_IMAGE="ecom-user-service:broken-v999"
    APP_LABEL="user-service"
fi

echo "=========================================================="
echo "🚨 Person D: Bad-Deploy Self-Healing Auto-Rollback Demo"
echo "Target: ${DEPLOYMENT} (container: ${CONTAINER}) in namespace ${NAMESPACE}"
echo "=========================================================="

echo -e "\n[Step 1] Inspecting initial healthy revision..."
if ! kubectl get deployment "${DEPLOYMENT}" -n "${NAMESPACE}" -o wide; then
    echo -e "\n⚠️ Deployment '${DEPLOYMENT}' not found in namespace '${NAMESPACE}'!"
    echo "Tip: Apply it first with: kubectl apply -k k8s/services/${TARGET}"
    exit 1
fi

echo -e "\n[Step 2] Simulating faulty deploy with broken image: ${BAD_IMAGE}..."
kubectl set image deployment/"${DEPLOYMENT}" "${CONTAINER}=${BAD_IMAGE}" -n "${NAMESPACE}"

echo -e "\n[Step 3] Monitoring rollout status (15s timeout to catch failure)..."
if kubectl rollout status deployment/"${DEPLOYMENT}" -n "${NAMESPACE}" --timeout=15s; then
    echo "Unexpected: Rollout succeeded!"
else
    echo -e "\n❌ Rollout FAILED or STALLED as expected (ImagePullBackOff / CrashLoopBackOff)!"
    
    echo -e "\n[Step 4] Executing automated self-healing rollback: kubectl rollout undo..."
    kubectl rollout undo deployment/"${DEPLOYMENT}" -n "${NAMESPACE}"

    echo -e "\n[Step 5] Waiting for previous healthy revision to stabilize..."
    kubectl rollout status deployment/"${DEPLOYMENT}" -n "${NAMESPACE}" --timeout=60s

    echo -e "\n=========================================================="
    echo "🎉 DEMO SUCCESSFUL: Auto-rollback restored stable deployment!"
    kubectl get pods -l "app=${APP_LABEL}" -n "${NAMESPACE}"
    echo "=========================================================="
fi
