#!/bin/bash

# SSH-based rollback script for Joinery applications
# Usage: ./ssh-rollback.sh <app_name> <environment> <ssh_user> <ssh_host> [ssh_port] [backup_tag]

set -euo pipefail

APP_NAME=${1:-}
ENVIRONMENT=${2:-}
SSH_USER=${3:-}
SSH_HOST=${4:-}
SSH_PORT=${5:-22}
BACKUP_TAG=${6:-}

if [[ -z "$APP_NAME" || -z "$ENVIRONMENT" || -z "$SSH_USER" || -z "$SSH_HOST" ]]; then
    echo "Usage: $0 <app_name> <environment> <ssh_user> <ssh_host> [ssh_port] [backup_tag]"
    echo "  app_name: Name of the application to rollback"
    echo "  environment: Environment (dev, staging, prod)"
    echo "  ssh_user: SSH username"
    echo "  ssh_host: SSH host"
    echo "  ssh_port: SSH port (optional, default: 22)"
    echo "  backup_tag: Specific backup to restore (optional, uses latest if not specified)"
    exit 1
fi

CONTAINER_NAME="${APP_NAME}-${ENVIRONMENT}"

echo "=== Rollback: $APP_NAME ($ENVIRONMENT) ==="
echo "Container: $CONTAINER_NAME"
echo "Target: $SSH_USER@$SSH_HOST:$SSH_PORT"
echo "Backup tag: ${BACKUP_TAG:-latest}"
echo "========================================="

# Create rollback script to run on remote host
cat > /tmp/rollback_remote.sh << EOF
#!/bin/bash
set -euo pipefail

CONTAINER_NAME="$CONTAINER_NAME"
BACKUP_TAG="$BACKUP_TAG"

echo "Starting rollback process on remote host..."

# Find available backups
echo "Available backups:"
BACKUPS=\$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "\$CONTAINER_NAME-backup-" | sort -r)
if [[ -z "\$BACKUPS" ]]; then
    echo "❌ No backups found for \$CONTAINER_NAME"
    exit 1
fi

echo "\$BACKUPS"

# Determine which backup to use
if [[ -n "\$BACKUP_TAG" ]]; then
    BACKUP_IMAGE="\$CONTAINER_NAME-backup-\$BACKUP_TAG"
    if ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "\$BACKUP_IMAGE"; then
        echo "❌ Backup \$BACKUP_IMAGE not found"
        exit 1
    fi
else
    # Use the most recent backup
    BACKUP_IMAGE=\$(echo "\$BACKUPS" | head -n1)
fi

echo "Rolling back to: \$BACKUP_IMAGE"

# Stop current container
echo "Stopping current container..."
if docker ps --format '{{.Names}}' | grep -Eq "^\$CONTAINER_NAME\$"; then
    docker stop "\$CONTAINER_NAME" || echo "Container was not running"
    docker rm "\$CONTAINER_NAME" || echo "Container removal failed"
fi

# Get the port configuration from the backup metadata
# This is a simplified approach - in production you might want to store metadata
HOST_PORT=\$(docker inspect "\$BACKUP_IMAGE" --format='{{range \$p, \$conf := .Config.ExposedPorts}}{{\$p}}{{end}}' | cut -d'/' -f1 || echo "8080")
CONTAINER_PORT=\$HOST_PORT

# Start container from backup
echo "Starting container from backup..."
docker run -d \
    --name "\$CONTAINER_NAME" \
    --restart unless-stopped \
    -p "80:\$CONTAINER_PORT" \
    -e ASPNETCORE_ENVIRONMENT="$ENVIRONMENT" \
    -e ASPNETCORE_URLS="http://+:\$CONTAINER_PORT" \
    "\$BACKUP_IMAGE"

# Wait for container to start
echo "Waiting for container to start..."
sleep 10

# Verify rollback
if docker ps --format '{{.Names}}' | grep -Eq "^\$CONTAINER_NAME\$"; then
    echo "✅ Rollback successful! Container is running:"
    docker ps --filter name="\$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo "❌ Rollback failed - container is not running"
    docker logs "\$CONTAINER_NAME" || echo "Could not retrieve logs"
    exit 1
fi

echo "Rollback completed successfully!"
EOF

# Make script executable and transfer to remote host
chmod +x /tmp/rollback_remote.sh

echo "Transferring rollback script to remote host..."
scp -P "$SSH_PORT" /tmp/rollback_remote.sh "$SSH_USER@$SSH_HOST:/tmp/rollback_remote.sh"

echo "Executing rollback on remote host..."
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "bash /tmp/rollback_remote.sh"

echo "Cleaning up temporary files..."
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "rm -f /tmp/rollback_remote.sh"
rm -f /tmp/rollback_remote.sh

echo "🎉 Rollback completed successfully!"