# ==============================================================================
# Person D — Local Kind Kubernetes Cluster Setup Script (PowerShell)
# ==============================================================================

$ClusterName = "ecom-sre-cluster"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Standing up local kind cluster: $ClusterName" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

$existing = kind get clusters 2>$null
if ($existing -contains $ClusterName) {
    Write-Host "Cluster '$ClusterName' already exists." -ForegroundColor Green
} else {
    Write-Host "Creating multi-node kind cluster from k8s/kind-config.yaml..." -ForegroundColor Cyan
    kind create cluster --config k8s/kind-config.yaml
}

Write-Host "`n[Step 1] Applying Kubernetes Base Configurations (Namespace, ConfigMap, Secrets)..." -ForegroundColor Cyan
kubectl apply -k k8s/base

Write-Host "`n[Step 2] Applying Microservices Manifests & HPA..." -ForegroundColor Cyan
kubectl apply -k k8s/

Write-Host "`n[Step 3] Cluster status:" -ForegroundColor Green
kubectl get nodes -o wide
kubectl get pods,svc,hpa -n ecom

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "✅ Local Kubernetes Cluster is ready for Person D scaling & delivery!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
