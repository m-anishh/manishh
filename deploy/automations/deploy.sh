#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:?AWS_REGION is required}"
: "${EKS_CLUSTER_NAME:?EKS_CLUSTER_NAME is required}"
: "${IMAGE:?IMAGE is required}"

aws eks update-kubeconfig --region "$AWS_REGION" --name "$EKS_CLUSTER_NAME"
envsubst < deploy/k8s/portfolio.yaml | kubectl apply -f -
kubectl rollout status deployment/portfolio --timeout=180s
