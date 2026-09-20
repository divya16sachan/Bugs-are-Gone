#!/usr/bin/env bash
# Person B Chaos Engineering: Kill Pod Script for Kubernetes Resilience Testing

SERVICE=${1:-catalog}
NAMESPACE=${2:-ecom}

echo "================ Kubernetes Pod Chaos Test ================"
echo "Target Service   : $SERVICE"
echo "Target Namespace : $NAMESPACE"

POD=$(kubectl get pods -n "$NAMESPACE" -l "app=$SERVICE" -o jsonpath="{.items[0].metadata.name}" 2>/dev/null)

if [ -z "$POD" ]; then
    echo "Warning: No active pod found for app=$SERVICE in namespace $NAMESPACE"
    kubectl get pods -n "$NAMESPACE"
    exit 1
fi

echo "Selected target pod : $POD"
echo "Simulating abrupt pod crash / node failure..."

kubectl delete pod "$POD" -n "$NAMESPACE" --grace-period=0 --force

echo "Pod terminated. Monitoring replica replacement..."
sleep 2
kubectl get pods -n "$NAMESPACE" -l "app=$SERVICE"

echo "Pod chaos executed successfully."
echo "==========================================================="
