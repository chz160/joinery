#!/bin/bash

# Environment setup script for Joinery infrastructure
# Usage: ./setup-env.sh <environment>

set -euo pipefail

ENVIRONMENT=${1:-}

if [[ -z "$ENVIRONMENT" ]]; then
    echo "Usage: $0 <environment>"
    echo "  environment: Environment to set up (dev, staging, prod)"
    exit 1
fi

case $ENVIRONMENT in
    dev|staging|prod)
        echo "Setting up $ENVIRONMENT environment"
        ;;
    *)
        echo "Error: Invalid environment. Must be one of: dev, staging, prod"
        exit 1
        ;;
esac

# Create namespace
echo "Creating namespace $ENVIRONMENT"
kubectl create namespace "$ENVIRONMENT" --dry-run=client -o yaml | kubectl apply -f -

# Create docker registry secret (requires manual token input)
echo "Creating Docker registry secret..."
kubectl create secret docker-registry docker-registry-secret \
  --namespace="$ENVIRONMENT" \
  --docker-server=docker.io \
  --docker-username=joinery \
  --docker-password="$DOCKER_REGISTRY_TOKEN" \
  --dry-run=client -o yaml | kubectl apply -f -

# Label namespace for network policies
kubectl label namespace "$ENVIRONMENT" environment="$ENVIRONMENT" --overwrite

echo "Environment $ENVIRONMENT setup completed successfully"