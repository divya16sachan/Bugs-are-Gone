# ==============================================================================
# Person D — Bad Deployment & Self-Healing Auto-Rollback Demo (PowerShell)
# ==============================================================================

param(
    [string]$Target = ""
)

$Namespace = "ecom"

# Auto-detect deployment if not specified
if ([string]::IsNullOrWhiteSpace($Target)) {
    $hasUser = kubectl get deployment user-service-deployment -n $Namespace 2>$null
    if ($LASTEXITCODE -eq 0) {
        $Target = "user-service"
    } else {
        $hasHello = kubectl get deployment hello-world-deployment -n $Namespace 2>$null
        if ($LASTEXITCODE -eq 0) {
            $Target = "hello-world"
        } else {
            $Target = "user-service"
        }
    }
}

if ($Target -eq "hello-world") {
    $Deployment = "hello-world-deployment"
    $Container = "hello-world"
    $BadImage = "ecom-hello-world:broken-v999"
    $AppLabel = "hello-world"
} else {
    $Deployment = "user-service-deployment"
    $Container = "user-service"
    $BadImage = "ecom-user-service:broken-v999"
    $AppLabel = "user-service"
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚨 Person D: Bad-Deploy Self-Healing Auto-Rollback Demo" -ForegroundColor Yellow
Write-Host "Target: $Deployment (container: $Container) in namespace $Namespace"
Write-Host "==========================================================" -ForegroundColor Cyan

Write-Host "`n[Step 1] Inspecting initial healthy revision..." -ForegroundColor Green
kubectl get deployment $Deployment -n $Namespace -o wide
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️ Deployment '$Deployment' not found in namespace '$Namespace'!" -ForegroundColor Red
    Write-Host "Tip: Apply it first with: kubectl apply -k k8s/services/$Target" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n[Step 2] Simulating faulty deploy with broken image: $BadImage..." -ForegroundColor Yellow
kubectl set image "deployment/$Deployment" "$Container=$BadImage" -n $Namespace

Write-Host "`n[Step 3] Monitoring rollout status (15s timeout to catch failure)..." -ForegroundColor Yellow
$rolloutResult = kubectl rollout status "deployment/$Deployment" -n $Namespace --timeout=15s 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Rollout FAILED/STALLED as expected! Error captured." -ForegroundColor Red
    
    Write-Host "`n[Step 4] Executing automated self-healing rollback: kubectl rollout undo..." -ForegroundColor Cyan
    kubectl rollout undo "deployment/$Deployment" -n $Namespace

    Write-Host "`n[Step 5] Waiting for previous healthy revision to stabilize..." -ForegroundColor Green
    kubectl rollout status "deployment/$Deployment" -n $Namespace --timeout=60s

    Write-Host "`n==========================================================" -ForegroundColor Cyan
    Write-Host "🎉 DEMO SUCCESSFUL: Auto-rollback restored stable deployment!" -ForegroundColor Green
    kubectl get pods -l "app=$AppLabel" -n $Namespace
    Write-Host "==========================================================" -ForegroundColor Cyan
} else {
    Write-Host "Rollout succeeded unexpectedly." -ForegroundColor Yellow
}
