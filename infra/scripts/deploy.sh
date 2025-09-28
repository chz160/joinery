#!/bin/bash

# Joinery Application Deployment Script
# Usage: ./deploy.sh <app_name> <environment> [image_tag]

set -euo pipefail

APP_NAME=${1:-}
ENVIRONMENT=${2:-}
IMAGE_TAG=${3:-latest}

if [[ -z "$APP_NAME" || -z "$ENVIRONMENT" ]]; then
    echo "Usage: $0 <app_name> <environment> [image_tag]"
    echo "  app_name: Name of the application to deploy"
    echo "  environment: Target environment (dev, staging, prod)"
    echo "  image_tag: Docker image tag (default: latest)"
    exit 1
fi

# Validate environment
case $ENVIRONMENT in
    dev|staging|prod)
        echo "Deploying $APP_NAME to $ENVIRONMENT environment with tag $IMAGE_TAG"
        ;;
    *)
        echo "Error: Invalid environment. Must be one of: dev, staging, prod"
        exit 1
        ;;
esac

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed"
    exit 1
fi

# Check if namespace exists, create if not
if ! kubectl get namespace "$ENVIRONMENT" &> /dev/null; then
    echo "Creating namespace $ENVIRONMENT"
    kubectl create namespace "$ENVIRONMENT"
fi

# Apply Kubernetes manifests
echo "Applying Kubernetes manifests for $APP_NAME"

# Use envsubst to substitute variables in templates
export APP_NAME ENVIRONMENT IMAGE_TAG
envsubst < "k8s/${APP_NAME}/deployment.yaml" | kubectl apply -f -
envsubst < "k8s/${APP_NAME}/service.yaml" | kubectl apply -f -

# Apply ingress if it exists
if [[ -f "k8s/${APP_NAME}/ingress.yaml" ]]; then
    envsubst < "k8s/${APP_NAME}/ingress.yaml" | kubectl apply -f -
fi

# Apply configmap if it exists
if [[ -f "k8s/${APP_NAME}/configmap.yaml" ]]; then
    envsubst < "k8s/${APP_NAME}/configmap.yaml" | kubectl apply -f -
fi

echo "Deployment completed successfully"
echo "Checking rollout status..."
kubectl rollout status deployment/"$APP_NAME" -n "$ENVIRONMENT" --timeout=300s

echo "Current pods:"
kubectl get pods -n "$ENVIRONMENT" -l app="$APP_NAME"