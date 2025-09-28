# Joinery Infrastructure

This repository contains the infrastructure orchestration and CI/CD pipeline configurations for deploying the complete Joinery application stack across different environments.

## Overview

The Joinery infrastructure repository serves as the **orchestration hub** for deploying and managing the entire Joinery application stack. It provides:

- **Stack Orchestration**: Docker Compose configurations for multi-service deployment
- **CI/CD Workflows**: Reusable GitHub Actions for automated deployment pipelines  
- **Environment Management**: Kubernetes manifests and environment-specific configurations
- **Deployment Automation**: Scripts for both Kubernetes and SSH-based Docker deployments
- **Health Monitoring**: Automated health checks and rollback capabilities
- **Reference Templates**: Base configurations and example workflows

### Separation of Concerns

This repository focuses on **orchestration and deployment**, while individual application repositories handle their own:
- **Application Code**: Business logic, APIs, and frontend components
- **Build Configuration**: Dockerfiles, build scripts, and dependency management
- **Application Testing**: Unit tests, integration tests, and application-specific CI

The infrastructure repository references pre-built application images from their respective repositories, enabling clean separation between application development and deployment orchestration.

## Repository Structure and Relationships

### Infrastructure Repository Structure

```
joinery-infra/
├── .github/workflows/          # CI/CD orchestration workflows
│   ├── build.yml              # Docker build and push workflow
│   ├── deploy.yml             # Kubernetes deployment workflow
│   └── ssh-deploy.yml         # SSH-based Docker deployment workflow
├── docker-compose.yml         # Multi-service stack orchestration
├── docker/                    # Docker configurations
│   └── base/                 # Base Dockerfiles for different tech stacks
│       ├── Dockerfile.node   # Node.js applications
│       ├── Dockerfile.python # Python applications
│       └── Dockerfile.dotnet # .NET applications
├── k8s/                      # Kubernetes manifests
│   └── example-app/          # Example application manifests
├── scripts/                  # Deployment and utility scripts
│   ├── deploy.sh            # Kubernetes deployment script
│   ├── setup-env.sh         # Environment setup script
│   ├── health-check.sh      # Kubernetes health check script
│   ├── ssh-deploy.sh        # SSH-based Docker deployment script
│   ├── ssh-health-check.sh  # SSH-based health check script
│   └── ssh-rollback.sh      # SSH-based rollback script
├── examples/                 # Example configurations
│   ├── ci-cd-workflow.yml   # Kubernetes deployment workflow
│   ├── ci-cd-dotnet-ssh.yml # .NET SSH deployment workflow
│   ├── Dockerfile.node      # Node.js Dockerfile example
│   └── Dockerfile.dotnet    # .NET Dockerfile example
├── terraform/               # Infrastructure as Code (future)
└── config.yaml             # Environment configurations
```

### Application Repository Structure (Recommended)

Each application repository should maintain its own build configuration:

```
joinery-server/              # Example .NET API application
├── .github/workflows/
│   └── build.yml           # Application-specific build workflow
├── src/                    # Application source code
├── Dockerfile              # Application-specific Docker build
├── appsettings.json        # Application configuration
└── README.md

joinery-web/                # Example frontend application  
├── .github/workflows/
│   └── build.yml           # Application-specific build workflow
├── src/                    # Frontend source code
├── Dockerfile              # Application-specific Docker build
├── package.json            # Dependencies and build scripts
└── README.md
```

### Relationship Between Repositories

1. **Application Repositories** (`joinery-server`, `joinery-web`, etc.):
   - Own their source code, Dockerfiles, and build configurations
   - Build and push Docker images to a container registry
   - May trigger deployment workflows in the infrastructure repository

2. **Infrastructure Repository** (`joinery-infra`):
   - References pre-built application images by tag/version
   - Orchestrates multi-service deployments using Docker Compose
   - Manages environment-specific configurations and secrets
   - Provides reusable CI/CD workflows for consistent deployments

## Stack Orchestration with Docker Compose

### Complete Stack Deployment

The infrastructure repository includes a `docker-compose.yml` file that orchestrates the entire Joinery application stack by referencing pre-built images from application repositories:

```yaml
version: "3.8"

services:
  api:
    image: chz160/joinery-server:latest  # Built by joinery-server repo
    ports:
      - "5256:5256"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
    depends_on:
      - db
    networks:
      - joinery-network
    restart: unless-stopped

  web:
    image: chz160/joinery-web:latest     # Built by joinery-web repo
    ports:
      - "80:80"
    environment:
      - API_URL=http://api:5256
    depends_on:
      - api
    networks:
      - joinery-network
    restart: unless-stopped

  db:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=joinery
      - POSTGRES_USER=joinery
      - POSTGRES_PASSWORD=supersecure
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - joinery-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  joinery-network:
    driver: bridge
```

### Deployment Workflow Example

```yaml
name: Deploy Joinery Stack

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout infrastructure repo
        uses: actions/checkout@v4
      
      - name: Deploy stack
        run: |
          # Pull latest images built by application repositories
          docker-compose pull
          
          # Deploy the complete stack
          docker-compose up -d
          
          # Verify deployment
          docker-compose ps
```

## Quick Start

### For Docker Compose Stack Deployment

To deploy the complete Joinery stack using Docker Compose:

1. **Application Repositories Build and Push**: Ensure your application repositories (e.g., `joinery-server`, `joinery-web`) have CI workflows that build and push Docker images:

   ```yaml
   # Example: joinery-server/.github/workflows/build.yml
   name: Build and Push
   on:
     push:
       branches: [main]
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - name: Build and push Docker image
           run: |
             docker build -t chz160/joinery-server:latest .
             docker push chz160/joinery-server:latest
   ```

2. **Deploy the Stack**: From the infrastructure repository:

   ```bash
   # Pull latest application images
   docker-compose pull
   
   # Deploy the complete stack
   docker-compose up -d
   
   # View running services
   docker-compose ps
   ```

3. **Environment Configuration**: Override settings using environment files:

   ```bash
   # Create environment-specific compose file
   cp docker-compose.yml docker-compose.prod.yml
   
   # Deploy with production overrides
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

### For Kubernetes Deployment

To use this infrastructure for Kubernetes deployment in your Joinery application repository:

1. Add the following workflow to `.github/workflows/ci-cd.yml`:

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    uses: chz160/joinery-infra/.github/workflows/build.yml@main
    with:
      app_name: your-app-name
    secrets:
      DOCKER_REGISTRY_TOKEN: ${{ secrets.DOCKER_REGISTRY_TOKEN }}
  
  deploy-dev:
    if: github.ref == 'refs/heads/develop'
    needs: build
    uses: chz160/joinery-infra/.github/workflows/deploy.yml@main
    with:
      app_name: your-app-name
      environment: dev
      image_tag: ${{ needs.build.outputs.image_tag }}
    secrets:
      DOCKER_REGISTRY_TOKEN: ${{ secrets.DOCKER_REGISTRY_TOKEN }}
      KUBE_CONFIG: ${{ secrets.KUBE_CONFIG }}
  
  deploy-prod:
    if: github.ref == 'refs/heads/main'
    needs: build
    uses: chz160/joinery-infra/.github/workflows/deploy.yml@main
    with:
      app_name: your-app-name
      environment: prod
      image_tag: ${{ needs.build.outputs.image_tag }}
    secrets:
      DOCKER_REGISTRY_TOKEN: ${{ secrets.DOCKER_REGISTRY_TOKEN }}
      KUBE_CONFIG: ${{ secrets.KUBE_CONFIG }}
```

2. Create Kubernetes manifests in `k8s/your-app-name/` (copy from `k8s/example-app/`)

3. Add a Dockerfile using one of the base images from `docker/base/`

### For SSH-based Docker Deployment (.NET Applications)

For deploying .NET applications to on-premises Docker hosts via SSH:

1. Copy the example workflow from `examples/ci-cd-dotnet-ssh.yml` to `.github/workflows/ci-cd.yml`

2. Create a Dockerfile using the .NET base image (`examples/Dockerfile.dotnet`)

3. Configure the required GitHub secrets for SSH deployment:
   - `SSH_PRIVATE_KEY_[ENV]`: SSH private key for each environment
   - `SSH_HOST_[ENV]`: Target server hostname/IP for each environment  
   - `SSH_USER_[ENV]`: SSH username for each environment
   - `SSH_PORT_[ENV]`: SSH port (optional, defaults to 22)
   - `DOCKER_REGISTRY_TOKEN`: Token for pushing to Docker registry

4. Ensure your target servers have Docker installed and the SSH user has Docker permissions

### Environment Setup

Set up a new environment:

```bash
# Set environment variables
export DOCKER_REGISTRY_TOKEN="your-token"

# Run setup script
./scripts/setup-env.sh dev
```

### Manual SSH Deployment

Deploy a .NET application manually via SSH:

```bash
# Deploy to development
./scripts/ssh-deploy.sh joinery-server dev latest 8080 8080 deploy_user dev.example.com 22

# Deploy to production  
./scripts/ssh-deploy.sh joinery-server prod v1.2.0 8080 80 deploy_user prod.example.com
```

### SSH Health Checks

Check application health on remote Docker host:

```bash
./scripts/ssh-health-check.sh joinery-server prod 80 deploy_user prod.example.com
```

### SSH Rollback

Rollback to a previous version:

```bash
# Rollback to latest backup
./scripts/ssh-rollback.sh joinery-server prod deploy_user prod.example.com

# Rollback to specific backup
./scripts/ssh-rollback.sh joinery-server prod deploy_user prod.example.com 22 20241228-143000
```

## Configuration

Environment-specific configurations are managed in `config.yaml`. Each environment (dev, staging, prod) has its own resource limits, replica counts, and domain settings.

## Security

### General Security
- Applications run as non-root users
- Docker images use minimal base images  
- Kubernetes manifests include security contexts
- Secrets are managed through Kubernetes secrets and GitHub Actions secrets

### SSH Deployment Security
- SSH keys are stored securely in GitHub Actions secrets
- Private keys should use strong encryption and be regularly rotated
- SSH connections use key-based authentication only
- Target servers should have fail2ban or similar protection
- Docker containers run as non-root users
- Environment variables are injected securely without committing secrets

### Secret Management Best Practices
- Never commit real secrets or configuration files with credentials
- Use `.env.example` and `appsettings.*.json.example` files with placeholders
- For local development, use `.local.json` files (ignored by git)
- For production, use environment variables and managed secret stores
- Enable GitHub secret scanning and dependabot alerts
- Regularly rotate SSH keys and Docker registry tokens

## Development

When making changes to the infrastructure:

1. Test changes in the dev environment first
2. Update documentation if adding new features
3. Follow the principle of minimal, surgical changes
4. Ensure backward compatibility with existing applications

## Required Secrets

### For Kubernetes Deployment
The following secrets need to be configured in GitHub Actions:

- `DOCKER_REGISTRY_TOKEN`: Token for pushing to Docker registry
- `KUBE_CONFIG`: Base64-encoded Kubernetes config for cluster access

### For SSH-based Docker Deployment
The following secrets need to be configured for each environment (replace [ENV] with dev, staging, prod):

- `DOCKER_REGISTRY_TOKEN`: Token for pushing to Docker registry
- `SSH_PRIVATE_KEY_[ENV]`: SSH private key for accessing the target server
- `SSH_HOST_[ENV]`: Target server hostname or IP address
- `SSH_USER_[ENV]`: SSH username with Docker permissions
- `SSH_PORT_[ENV]`: SSH port (optional, defaults to 22)

Example environment-specific secrets:
- `SSH_PRIVATE_KEY_DEV`, `SSH_HOST_DEV`, `SSH_USER_DEV`
- `SSH_PRIVATE_KEY_STAGING`, `SSH_HOST_STAGING`, `SSH_USER_STAGING`  
- `SSH_PRIVATE_KEY_PROD`, `SSH_HOST_PROD`, `SSH_USER_PROD`

## Troubleshooting

### SSH Deployment Issues

**SSH Connection Failed:**
- Verify SSH keys are correctly configured in GitHub secrets
- Check that the target server accepts key-based authentication
- Ensure SSH port is correct (default: 22)
- Verify SSH user has necessary permissions

**Docker Permission Denied:**
- Add SSH user to docker group: `sudo usermod -aG docker $USER`
- Restart SSH session after group change
- Verify with: `docker ps` (should work without sudo)

**Container Failed to Start:**
- Check container logs: `docker logs <container-name>`
- Verify environment variables are set correctly
- Check port conflicts: `netstat -tlnp | grep :8080`
- Ensure Docker image was pulled successfully

**Health Check Failed:**
- Verify application exposes health endpoint at `/health` or `/healthcheck`
- Check container port configuration matches application
- Verify firewall allows traffic on specified ports
- Check application startup time (may need to adjust health check timeout)

**Rollback Issues:**
- Verify backups exist: `docker images | grep backup`
- Check backup image integrity
- Ensure sufficient disk space for rollback operation

### General Issues

**Build Failed:**
- Check Dockerfile syntax and base image availability
- Verify .NET SDK version compatibility
- Review build logs for dependency issues

**Registry Push Failed:**
- Verify `DOCKER_REGISTRY_TOKEN` is valid and not expired
- Check Docker registry permissions
- Ensure image size is within registry limits

## Support

For questions about using this infrastructure, please reach out to the DevOps team or create an issue in this repository.
