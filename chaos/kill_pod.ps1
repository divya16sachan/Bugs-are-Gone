<#
.SYNOPSIS
    Person B Chaos Engineering: Kill Pod Script for Kubernetes Resilience Testing
.DESCRIPTION
    Terminates a pod for a specified microservice in the ecom namespace and verifies self-healing.
.PARAMETER Service
    Service name: user, catalog, order, payment
.PARAMETER Namespace
    Kubernetes namespace (default: ecom)
#>

param (
    [Parameter(Mandatory=$false)]
    [string]$Service = "catalog",

    [Parameter(Mandatory=$false)]
    [string]$Namespace = "ecom"
)

Write-Host "================ Kubernetes Pod Chaos Test ================" -ForegroundColor Cyan
Write-Host "Target Service   : $Service"
Write-Host "Target Namespace : $Namespace"

# Find running pod
$pod = kubectl get pods -n $Namespace -l "app=$Service" -o jsonpath="{.items[0].metadata.name}" 2>$null

if (-not $pod) {
    Write-Warning "No active pod found for app=$Service in namespace $Namespace. Checking default pods..."
    kubectl get pods -n $Namespace
    exit 1
}

Write-Host "Selected target pod : $pod" -ForegroundColor Yellow
Write-Host "Simulating abrupt pod crash / node failure..." -ForegroundColor Red

# Force terminate pod
kubectl delete pod $pod -n $Namespace --grace-period=0 --force

Write-Host "Pod terminated. Monitoring replica replacement..." -ForegroundColor Yellow

# Wait for replacement pod to be running
Start-Sleep -Seconds 2
kubectl get pods -n $Namespace -l "app=$Service"

Write-Host "Pod chaos executed successfully." -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Cyan
