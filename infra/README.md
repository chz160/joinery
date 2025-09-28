# Joinery Infrastructure

This repository contains the infrastructure and CI/CD pipeline configurations for deploying Joinery applications across different environments.

## Overview

The Joinery infrastructure repository provides:
- Reusable GitHub Actions workflows for building and deploying applications
- Kubernetes manifests and deployment configurations  
- Docker base images for consistent containerization
- Environment-specific configuration management
- Automated deployment scripts and health checks

## Structure

```
├── .github/workflows/     # GitHub Actions workflows
│   ├── build.yml         # Docker build and push workflow
│   └── deploy.yml        # Kubernetes deployment workflow
├── docker/               # Docker configurations
│   └── base/            # Base Dockerfiles for different tech stacks
├── k8s/                 # Kubernetes manifests
│   └── example-app/     # Example application manifests
├── scripts/             # Deployment and utility scripts
│   ├── deploy.sh        # Main deployment script
│   ├── setup-env.sh     # Environment setup script
│   └── health-check.sh  # Application health check script
├── terraform/           # Infrastructure as Code (future)
└── config.yaml         # Environment configurations
```

## Quick Start

### For Application Repositories

To use this infrastructure in your Joinery application repository:

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

### Environment Setup

Set up a new environment:

```bash
# Set environment variables
export DOCKER_REGISTRY_TOKEN="your-token"

# Run setup script
./scripts/setup-env.sh dev
```

### Manual Deployment

Deploy an application manually:

```bash
./scripts/deploy.sh my-app dev latest
```

### Health Checks

Check application health:

```bash
./scripts/health-check.sh my-app dev
```

## Configuration

Environment-specific configurations are managed in `config.yaml`. Each environment (dev, staging, prod) has its own resource limits, replica counts, and domain settings.

## Security

- Applications run as non-root users
- Docker images use minimal base images  
- Kubernetes manifests include security contexts
- Secrets are managed through Kubernetes secrets and GitHub Actions secrets

## Development

When making changes to the infrastructure:

1. Test changes in the dev environment first
2. Update documentation if adding new features
3. Follow the principle of minimal, surgical changes
4. Ensure backward compatibility with existing applications

## Required Secrets

The following secrets need to be configured in GitHub Actions:

- `DOCKER_REGISTRY_TOKEN`: Token for pushing to Docker registry
- `KUBE_CONFIG`: Base64-encoded Kubernetes config for cluster access

## Support

For questions about using this infrastructure, please reach out to the DevOps team or create an issue in this repository.
