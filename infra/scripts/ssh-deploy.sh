#!/bin/bash

# SSH-based Docker deployment script for Joinery applications
# Usage: ./ssh-deploy.sh <app_name> <environment> <image_tag> <container_port> <host_port> <ssh_user> <ssh_host> [ssh_port] [registry_url]

set -euo pipefail

APP_NAME=${1:-}
ENVIRONMENT=${2:-}
IMAGE_TAG=${3:-latest}
CONTAINER_PORT=${4:-8080}
HOST_PORT=${5:-80}
SSH_USER=${6:-}
SSH_HOST=${7:-}
SSH_PORT=${8:-22}
REGISTRY_URL=${9:-registry.pocketfulofdoom.com}

if [[ -z "$APP_NAME" || -z "$ENVIRONMENT" || -z "$SSH_USER" || -z "$SSH_HOST" ]]; then
    echo "Usage: $0 <app_name> <environment> <image_tag> <container_port> <host_port> <ssh_user> <ssh_host> [ssh_port] [registry_url]"
    echo "  app_name: Name of the application to deploy"
    echo "  environment: Target environment (dev, staging, prod)"
    echo "  image_tag: Docker image tag"
    echo "  container_port: Application port inside container"
    echo "  host_port: Host port to expose"
    echo "  ssh_user: SSH username"
    echo "  ssh_host: SSH host"
    echo "  ssh_port: SSH port (optional, default: 22)"
    echo "  registry_url: Docker registry URL (optional, default: registry.pocketfulofdoom.com)"
    exit 1
fi

# Validate environment
case $ENVIRONMENT in
    dev|staging|prod)
        echo "Deploying $APP_NAME to $ENVIRONMENT environment"
        ;;
    *)
        echo "Error: Invalid environment. Must be one of: dev, staging, prod"
        exit 1
        ;;
esac

CONTAINER_NAME="${APP_NAME}-${ENVIRONMENT}"
# Support both legacy format (joinery/app:tag) and new registry format (registry.example.com/app:tag)
if [[ "$REGISTRY_URL" == "docker.io" ]] || [[ "$REGISTRY_URL" == "" ]]; then
    IMAGE_NAME="joinery/${APP_NAME}:${IMAGE_TAG}"
else
    IMAGE_NAME="${REGISTRY_URL}/${APP_NAME}:${IMAGE_TAG}"
fi

echo "=== SSH Docker Deployment ==="
echo "App: $APP_NAME"
echo "Environment: $ENVIRONMENT"
echo "Image: $IMAGE_NAME"
echo "Container: $CONTAINER_NAME"
echo "Ports: $HOST_PORT:$CONTAINER_PORT"
echo "Target: $SSH_USER@$SSH_HOST:$SSH_PORT"
echo "================================"

# Create deployment script to run on remote host
cat > /tmp/deploy_remote.sh << EOF
#!/bin/bash
set -euo pipefail

CONTAINER_NAME="$CONTAINER_NAME"
IMAGE_NAME="$IMAGE_NAME"
HOST_PORT="$HOST_PORT"
CONTAINER_PORT="$CONTAINER_PORT"
ENVIRONMENT="$ENVIRONMENT"

echo "Starting deployment on remote host..."

# Login to Docker registry if token provided
if [[ -n "\${DOCKER_REGISTRY_TOKEN:-}" ]]; then
    echo "Logging into Docker registry..."
    # Determine registry URL from image name or use default
    REGISTRY_URL=\$(echo "\$IMAGE_NAME" | cut -d'/' -f1)
    if [[ "\$REGISTRY_URL" == *"."* ]]; then
        # Image includes registry URL (e.g., registry.example.com/image:tag)
        echo "\$DOCKER_REGISTRY_TOKEN" | docker login "\$REGISTRY_URL" --password-stdin -u "\${DOCKER_REGISTRY_USERNAME:-joinery}"
    else
        # Default to Docker Hub
        echo "\$DOCKER_REGISTRY_TOKEN" | docker login --password-stdin -u "\${DOCKER_REGISTRY_USERNAME:-joinery}"
    fi
fi

# Pull the new image
echo "Pulling image: \$IMAGE_NAME"
docker pull "\$IMAGE_NAME"

# Check if container exists and back it up
if docker ps -a --format '{{.Names}}' | grep -Eq "^\\$CONTAINER_NAME\\\$"; then
    echo "Creating backup of existing container..."
    docker commit "\$CONTAINER_NAME" "\$CONTAINER_NAME-backup-\$(date +%Y%m%d-%H%M%S)" || echo "Backup failed, continuing..."
    
    echo "Stopping existing container..."
    docker stop "\$CONTAINER_NAME" || echo "Container was not running"
    
    echo "Removing existing container..."
    docker rm "\$CONTAINER_NAME" || echo "Container removal failed, continuing..."
fi

# Create and start new container
echo "Creating new container..."
docker run -d \
    --name "\$CONTAINER_NAME" \
    --restart unless-stopped \
    -p "\$HOST_PORT:\$CONTAINER_PORT" \
    -e ASPNETCORE_ENVIRONMENT="\$ENVIRONMENT" \
    -e ASPNETCORE_URLS="http://+:\$CONTAINER_PORT" \
    "\$IMAGE_NAME"

# Wait for container to start
echo "Waiting for container to start..."
sleep 10

# Verify container is running
if docker ps --format '{{.Names}}' | grep -Eq "^\\$CONTAINER_NAME\\\$"; then
    echo "✅ Container \$CONTAINER_NAME is running successfully"
    docker ps --filter name="\$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo "❌ Container failed to start"
    echo "Container logs:"
    docker logs "\$CONTAINER_NAME" || echo "Could not retrieve logs"
    exit 1
fi

# Clean up old images (keep last 3)
echo "Cleaning up old images..."
docker images "joinery/\${CONTAINER_NAME%%-*}" --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}}" | \
    sort -k2 -r | \
    tail -n +4 | \
    awk '{print \$1}' | \
    xargs -r docker rmi || echo "No old images to clean up"

echo "Deployment completed successfully!"
EOF

# Make script executable and transfer to remote host
chmod +x /tmp/deploy_remote.sh

echo "Transferring deployment script to remote host..."
scp -P "$SSH_PORT" /tmp/deploy_remote.sh "$SSH_USER@$SSH_HOST:/tmp/deploy_remote.sh"

echo "Executing deployment on remote host..."
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" \
    "export DOCKER_REGISTRY_TOKEN='${DOCKER_REGISTRY_TOKEN:-}'; bash /tmp/deploy_remote.sh"

echo "Cleaning up temporary files..."
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "rm -f /tmp/deploy_remote.sh"
rm -f /tmp/deploy_remote.sh

echo "🎉 Deployment completed successfully!"