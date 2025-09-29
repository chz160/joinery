# Joinery Infrastructure

Simple, minimal infrastructure setup for the Joinery application stack focused on Docker-based deployments.

## Overview

The Joinery infrastructure repository serves as the **deployment orchestration hub** for the Joinery application ecosystem. Following the KISS (Keep It Simple, Stupid) principle, it provides:

- **Stack Orchestration**: Docker Compose configurations for multi-service deployment
- **CI/CD Workflows**: Reusable GitHub Actions for automated build and deployment pipelines  
- **Simple Deployment**: SSH-based Docker deployment for production servers
- **Health Monitoring**: Automated health checks and rollback capabilities
- **Reference Templates**: Base Docker configurations and example workflows

### Deployment Philosophy

This infrastructure prioritizes **simplicity and speed** for MVP deployment:
- **Docker Compose** for local development and simple production stacks
- **SSH-based deployment** for remote server deployment without orchestration complexity
- **GitHub Actions** for automated CI/CD pipelines
- **No complex orchestration** - focusing on simple, proven deployment methods

### Separation of Concerns

This repository focuses on **deployment orchestration**, while individual application repositories handle their own:
- **Application Code**: Business logic, APIs, and frontend components
- **Build Configuration**: Dockerfiles, build scripts, and dependency management
- **Application Testing**: Unit tests, integration tests, and application-specific CI

The infrastructure repository references pre-built application images from their respective repositories, enabling clean separation between application development and deployment orchestration.

## Repository Structure

```
joinery-infra/
├── .github/workflows/          # CI/CD orchestration workflows
│   ├── build.yml              # Docker build and push workflow
│   ├── ssh-deploy.yml         # SSH-based Docker deployment workflow
│   └── deploy.yml             # Docker Compose stack deployment workflow
├── docker-compose.yml         # Multi-service stack orchestration
├── docker/                    # Docker configurations
│   └── base/                 # Base Dockerfiles for different tech stacks
│       ├── Dockerfile.node   # Node.js applications
│       ├── Dockerfile.python # Python applications
│       └── Dockerfile.dotnet # .NET applications
├── scripts/                  # Deployment and utility scripts
│   ├── ssh-deploy.sh        # SSH-based Docker deployment script
│   ├── ssh-health-check.sh  # SSH-based health check script
│   ├── ssh-rollback.sh      # SSH-based rollback script
│   └── check-security.sh    # Security validation script
├── examples/                 # Example configurations
│   ├── ci-cd-dotnet-ssh.yml # .NET SSH deployment workflow example
│   ├── deploy-stack.yml     # Stack deployment example
│   ├── Dockerfile.node      # Node.js Dockerfile example
│   ├── Dockerfile.dotnet    # .NET Dockerfile example
│   └── .env.example         # Environment variables example
└── config.yaml             # Environment configurations
```

## Quick Start

### For Docker Compose Stack Deployment

#### Local Development
1. Clone this repository:
```bash
git clone https://github.com/chz160/joinery-infra.git
cd joinery-infra
```

2. Start the complete stack:
```bash
docker-compose up -d
```

3. Access the applications:
- Web application: http://localhost
- API: http://localhost:5256
- Database: localhost:5432

#### Automated Production Deployment

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys the complete Joinery stack using Docker Compose to your production server.

**Deployment Triggers:**
- Automatically on push to `main` branch
- Manually via GitHub Actions UI with environment selection

**What the deployment does:**
1. Connects to your server via SSH
2. Transfers updated Docker Compose configuration
3. Logs into the on-prem Docker registry (registry.pocketfulofdoom.com)
4. Pulls latest images for joinery-server and joinery-web
5. Restarts the stack with `docker-compose up -d`
6. Performs health checks on all services
7. Provides detailed logging and rollback on failure

**Required Secrets for Stack Deployment:**
- `SSH_PRIVATE_KEY`: SSH private key for server access
- `SSH_HOST`: Target server hostname or IP
- `SSH_USER`: SSH username with Docker permissions
- `SSH_PORT`: SSH port (optional, defaults to 22)
- `DOCKER_REGISTRY_TOKEN`: Token for registry.pocketfulofdoom.com
- `DOCKER_REGISTRY_USERNAME`: Username for the registry

### For SSH-based Docker Deployment (.NET Applications)

To use this infrastructure for SSH-based deployment in your application repository:

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
      registry_url: registry.pocketfulofdoom.com
    secrets:
      DOCKER_REGISTRY_TOKEN: ${{ secrets.DOCKER_REGISTRY_TOKEN }}
      DOCKER_REGISTRY_USERNAME: ${{ secrets.DOCKER_REGISTRY_USERNAME }}
  
  deploy-dev:
    if: github.ref == 'refs/heads/develop'
    needs: build
    uses: chz160/joinery-infra/.github/workflows/ssh-deploy.yml@main
    with:
      app_name: your-app-name
      environment: dev
      image_tag: ${{ needs.build.outputs.image_tag }}
      registry_url: registry.pocketfulofdoom.com
    secrets:
      DOCKER_REGISTRY_TOKEN: ${{ secrets.DOCKER_REGISTRY_TOKEN }}
      DOCKER_REGISTRY_USERNAME: ${{ secrets.DOCKER_REGISTRY_USERNAME }}
      SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY_DEV }}
      SSH_HOST: ${{ secrets.SSH_HOST_DEV }}
      SSH_USER: ${{ secrets.SSH_USER_DEV }}
  
  deploy-prod:
    if: github.ref == 'refs/heads/main'
    needs: build
    uses: chz160/joinery-infra/.github/workflows/ssh-deploy.yml@main
    with:
      app_name: your-app-name
      environment: prod
      image_tag: ${{ needs.build.outputs.image_tag }}
      registry_url: registry.pocketfulofdoom.com
    secrets:
      DOCKER_REGISTRY_TOKEN: ${{ secrets.DOCKER_REGISTRY_TOKEN }}
      DOCKER_REGISTRY_USERNAME: ${{ secrets.DOCKER_REGISTRY_USERNAME }}
      SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY_PROD }}
      SSH_HOST: ${{ secrets.SSH_HOST_PROD }}
      SSH_USER: ${{ secrets.SSH_USER_PROD }}
```

2. Add a Dockerfile using one of the base images from `docker/base/`

### Manual SSH Deployment

For manual deployment to a remote server:

```bash
./scripts/ssh-deploy.sh <app_name> <environment> <image_tag> <container_port> <host_port> <ssh_user> <ssh_host> [ssh_port]
```

Example:
```bash
./scripts/ssh-deploy.sh my-app prod latest 8080 80 deploy user.example.com
```

### SSH Health Checks

Check the health of a deployed application:

```bash
./scripts/ssh-health-check.sh <app_name> <environment> <port> <ssh_user> <ssh_host> [ssh_port]
```

### SSH Rollback

Rollback to the previous version:

```bash
./scripts/ssh-rollback.sh <app_name> <environment> <ssh_user> <ssh_host> [ssh_port]
```

## Configuration

Environment-specific configurations are managed in multiple ways:

- **`config.yaml`**: Environment-specific domain settings and Docker registry configuration
- **`docker-compose.yml`**: Base stack configuration with service definitions and network topology referencing on-prem registry images
- **Environment overrides**: Use `docker-compose.prod.yml`, `docker-compose.staging.yml` for environment-specific customizations
- **Application configuration**: Individual app repos manage their own configuration files and environment variables

### Docker Registry Configuration

The infrastructure is configured to use the on-prem Docker registry:

- **Registry URL**: `registry.pocketfulofdoom.com`
- **Images**: 
  - `registry.pocketfulofdoom.com/joinery-server:latest`
  - `registry.pocketfulofdoom.com/joinery-web:latest`
- **Authentication**: Uses `DOCKER_REGISTRY_TOKEN` and `DOCKER_REGISTRY_USERNAME` secrets

## Required Secrets

### For Docker Registry Access
- `DOCKER_REGISTRY_TOKEN`: Token for accessing registry.pocketfulofdoom.com
- `DOCKER_REGISTRY_USERNAME`: Username for the registry (optional, defaults to 'joinery')

### For Docker Compose Stack Deployment
The following secrets are required for the automated stack deployment workflow:

- `SSH_PRIVATE_KEY`: SSH private key for accessing the target server
- `SSH_HOST`: Target server hostname or IP address
- `SSH_USER`: SSH username with Docker permissions
- `SSH_PORT`: SSH port (optional, defaults to 22)
- `DOCKER_REGISTRY_TOKEN`: Token for registry access
- `DOCKER_REGISTRY_USERNAME`: Registry username

### For SSH-based Docker Deployment (Individual Apps)
The following secrets need to be configured for each environment (replace [ENV] with dev, staging, prod):

- `SSH_PRIVATE_KEY_[ENV]`: SSH private key for accessing the target server
- `SSH_HOST_[ENV]`: Target server hostname or IP address
- `SSH_USER_[ENV]`: SSH username with Docker permissions
- `SSH_PORT_[ENV]`: SSH port (optional, defaults to 22)

Example environment-specific secrets:
- `SSH_PRIVATE_KEY_DEV`, `SSH_HOST_DEV`, `SSH_USER_DEV`
- `SSH_PRIVATE_KEY_STAGING`, `SSH_HOST_STAGING`, `SSH_USER_STAGING`  
- `SSH_PRIVATE_KEY_PROD`, `SSH_HOST_PROD`, `SSH_USER_PROD`

## Application Repositories

The following repositories work with this infrastructure:

- [joinery-server](https://github.com/chz160/joinery-server) - .NET API backend
- [joinery-web](https://github.com/chz160/joinery-web) - React frontend application

Each application repository should include:
- A `Dockerfile` (can use base images from `docker/base/`)
- GitHub Actions workflow referencing this infrastructure repo's reusable workflows

## Troubleshooting

### SSH Deployment Issues

**Connection refused:**
- Verify SSH credentials and network connectivity
- Check if SSH service is running on target server
- Validate SSH key permissions (should be 600)

**Docker daemon not available:**
- Ensure Docker is installed and running on target server
- Verify the SSH user has Docker permissions (in docker group)

**Permission denied:**
- Check SSH user has appropriate permissions
- Verify Docker group membership: `sudo usermod -aG docker $USER`

### General Issues

**Docker login failed:**
- Verify `DOCKER_REGISTRY_TOKEN` secret is correct
- Check Docker Hub account access

**Build failures:**
- Review build logs in GitHub Actions
- Ensure Dockerfile syntax is correct
- Verify base image availability

## Support

For questions about using this infrastructure, please reach out to the DevOps team or create an issue in this repository.

## What Was Removed

This repository was simplified by removing Kubernetes-related components to follow the KISS principle for MVP deployment. For details on what was removed and how to recover these features if needed, see [REMOVED_FEATURES.md](REMOVED_FEATURES.md).