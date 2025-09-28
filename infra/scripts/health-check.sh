#!/bin/bash

# Health check script for Joinery applications
# Usage: ./health-check.sh <app_name> <environment>

set -euo pipefail

APP_NAME=${1:-}
ENVIRONMENT=${2:-}

if [[ -z "$APP_NAME" || -z "$ENVIRONMENT" ]]; then
    echo "Usage: $0 <app_name> <environment>"
    echo "  app_name: Name of the application to check"
    echo "  environment: Environment to check (dev, staging, prod)"
    exit 1
fi

echo "Checking health of $APP_NAME in $ENVIRONMENT environment"

# Check if deployment exists
if ! kubectl get deployment "$APP_NAME" -n "$ENVIRONMENT" &> /dev/null; then
    echo "Error: Deployment $APP_NAME not found in namespace $ENVIRONMENT"
    exit 1
fi

# Check deployment status
echo "Deployment status:"
kubectl get deployment "$APP_NAME" -n "$ENVIRONMENT"

# Check pod status
echo -e "\nPod status:"
kubectl get pods -n "$ENVIRONMENT" -l app="$APP_NAME"

# Check service endpoints
echo -e "\nService endpoints:"
kubectl get endpoints "$APP_NAME" -n "$ENVIRONMENT" 2>/dev/null || echo "No endpoints found"

# Check recent events
echo -e "\nRecent events:"
kubectl get events -n "$ENVIRONMENT" --field-selector involvedObject.name="$APP_NAME" --sort-by='.firstTimestamp' | tail -5

# Check logs from latest pod
echo -e "\nRecent logs:"
LATEST_POD=$(kubectl get pods -n "$ENVIRONMENT" -l app="$APP_NAME" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [[ -n "$LATEST_POD" ]]; then
    kubectl logs "$LATEST_POD" -n "$ENVIRONMENT" --tail=10
else
    echo "No pods found for $APP_NAME"
fi