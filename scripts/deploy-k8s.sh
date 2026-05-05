#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-africlaw}"
REGISTRY="${REGISTRY:-ghcr.io}"
REPOSITORY="${REPOSITORY:-your-org/africlaw}"
TAG="${1:-latest}"

BOT_IMAGE="${REGISTRY}/${REPOSITORY}/bot-api:${TAG}"
BRAIN_IMAGE="${REGISTRY}/${REPOSITORY}/brain-service:${TAG}"

kubectl apply -f k8s/namespace.yaml
kubectl -n "${NAMESPACE}" apply -f k8s/configmap.yaml
kubectl -n "${NAMESPACE}" apply -f k8s/secret-template.yaml
kubectl -n "${NAMESPACE}" apply -f k8s/services.yaml
kubectl -n "${NAMESPACE}" apply -f k8s/redis-deployment.yaml
kubectl -n "${NAMESPACE}" apply -f k8s/bot-api-deployment.yaml
kubectl -n "${NAMESPACE}" apply -f k8s/brain-service-deployment.yaml

kubectl -n "${NAMESPACE}" set image deployment/bot-api bot-api="${BOT_IMAGE}" --record
kubectl -n "${NAMESPACE}" set image deployment/brain-service brain-service="${BRAIN_IMAGE}" --record
kubectl -n "${NAMESPACE}" apply -f k8s/hpa.yaml
kubectl -n "${NAMESPACE}" apply -f k8s/ingress.yaml
kubectl -n "${NAMESPACE}" apply -f k8s/servicemonitor.yaml

kubectl -n "${NAMESPACE}" rollout status deployment/bot-api
kubectl -n "${NAMESPACE}" rollout status deployment/brain-service

echo "Deployment complete."
