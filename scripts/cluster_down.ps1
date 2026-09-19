$ClusterName = "ecom-sre-cluster"
Write-Host "Deleting kind cluster $ClusterName..." -ForegroundColor Yellow
kind delete cluster --name $ClusterName
Write-Host "Cluster deleted." -ForegroundColor Green
