param(
  [string]$Tag = "latest",
  [string]$Namespace = "africlaw",
  [string]$Registry = "ghcr.io",
  [string]$Repository = "your-org/africlaw"
)

$ErrorActionPreference = "Stop"

$botImage = "$Registry/$Repository/bot-api:$Tag"
$brainImage = "$Registry/$Repository/brain-service:$Tag"

kubectl apply -f k8s/namespace.yaml
kubectl -n $Namespace apply -f k8s/configmap.yaml
kubectl -n $Namespace apply -f k8s/secret-template.yaml
kubectl -n $Namespace apply -f k8s/services.yaml
kubectl -n $Namespace apply -f k8s/redis-deployment.yaml
kubectl -n $Namespace apply -f k8s/bot-api-deployment.yaml
kubectl -n $Namespace apply -f k8s/brain-service-deployment.yaml

kubectl -n $Namespace set image deployment/bot-api bot-api=$botImage --record
kubectl -n $Namespace set image deployment/brain-service brain-service=$brainImage --record
kubectl -n $Namespace apply -f k8s/hpa.yaml
kubectl -n $Namespace apply -f k8s/ingress.yaml
kubectl -n $Namespace apply -f k8s/servicemonitor.yaml

kubectl -n $Namespace rollout status deployment/bot-api
kubectl -n $Namespace rollout status deployment/brain-service

Write-Host "Deployment complete."
