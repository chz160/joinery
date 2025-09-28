#!/bin/bash

# SSH-based health check script for Joinery applications
# Usage: ./ssh-health-check.sh <app_name> <environment> <host_port> <ssh_user> <ssh_host> [ssh_port]

set -euo pipefail

APP_NAME=${1:-}
ENVIRONMENT=${2:-}
HOST_PORT=${3:-80}
SSH_USER=${4:-}
SSH_HOST=${5:-}
SSH_PORT=${6:-22}

if [[ -z "$APP_NAME" || -z "$ENVIRONMENT" || -z "$SSH_USER" || -z "$SSH_HOST" ]]; then
    echo "Usage: $0 <app_name> <environment> <host_port> <ssh_user> <ssh_host> [ssh_port]"
    echo "  app_name: Name of the application to check"
    echo "  environment: Environment (dev, staging, prod)"
    echo "  host_port: Host port the application is exposed on"
    echo "  ssh_user: SSH username"
    echo "  ssh_host: SSH host"
    echo "  ssh_port: SSH port (optional, default: 22)"
    exit 1
fi

CONTAINER_NAME="${APP_NAME}-${ENVIRONMENT}"

echo "=== Health Check: $APP_NAME ($ENVIRONMENT) ==="
echo "Container: $CONTAINER_NAME"
echo "Host: $SSH_HOST:$HOST_PORT"
echo "=============================================="

# Create health check script to run on remote host
cat > /tmp/health_check_remote.sh << 'EOF'
#!/bin/bash
set -euo pipefail

CONTAINER_NAME="$1"
HOST_PORT="$2"
SSH_HOST="$3"

echo "🔍 Checking container status..."
if docker ps --format '{{.Names}}' | grep -Eq "^${CONTAINER_NAME}$"; then
    echo "✅ Container $CONTAINER_NAME is running"
    docker ps --filter name="$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo "❌ Container $CONTAINER_NAME is not running"
    echo "All containers:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    exit 1
fi

echo ""
echo "🔍 Checking application health endpoints..."

# Try multiple health endpoints
HEALTH_ENDPOINTS=(
    "http://localhost:${HOST_PORT}/health"
    "http://localhost:${HOST_PORT}/healthcheck"
    "http://localhost:${HOST_PORT}/"
    "http://${SSH_HOST}:${HOST_PORT}/health"
    "http://${SSH_HOST}:${HOST_PORT}/healthcheck"
    "http://${SSH_HOST}:${HOST_PORT}/"
)

HEALTH_CHECK_PASSED=false
for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
    echo "Testing: $endpoint"
    if curl -sf --max-time 10 "$endpoint" > /dev/null 2>&1; then
        echo "✅ Health check passed: $endpoint"
        HEALTH_CHECK_PASSED=true
        break
    else
        echo "❌ Health check failed: $endpoint"
    fi
done

if [ "$HEALTH_CHECK_PASSED" = false ]; then
    echo ""
    echo "⚠️  All health checks failed. Showing container logs:"
    docker logs --tail=20 "$CONTAINER_NAME" || echo "Could not retrieve logs"
    exit 1
fi

echo ""
echo "🔍 Recent container logs (last 10 lines):"
docker logs --tail=10 "$CONTAINER_NAME" || echo "Could not retrieve logs"

echo ""
echo "🔍 Container resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" "$CONTAINER_NAME" || echo "Could not retrieve stats"

echo ""
echo "✅ Health check completed successfully!"
EOF

# Make script executable and transfer to remote host
chmod +x /tmp/health_check_remote.sh

echo "Transferring health check script to remote host..."
scp -P "$SSH_PORT" /tmp/health_check_remote.sh "$SSH_USER@$SSH_HOST:/tmp/health_check_remote.sh"

echo "Running health check on remote host..."
if ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" \
    "bash /tmp/health_check_remote.sh '$CONTAINER_NAME' '$HOST_PORT' '$SSH_HOST'"; then
    echo "🎉 Health check passed!"
    exit_code=0
else
    echo "💥 Health check failed!"
    exit_code=1
fi

echo "Cleaning up temporary files..."
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "rm -f /tmp/health_check_remote.sh"
rm -f /tmp/health_check_remote.sh

exit $exit_code