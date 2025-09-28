# Removed Features Documentation

This document tracks the Kubernetes-related features that were removed from this repository as part of simplifying the infrastructure for MVP deployment (KISS principle).

## Removed Files and Directories

### Kubernetes Manifests
- `k8s/` - Entire directory containing Kubernetes deployment manifests
  - `k8s/example-app/configmap.yaml`
  - `k8s/example-app/deployment.yaml` 
  - `k8s/example-app/ingress.yaml`
  - `k8s/example-app/service.yaml`

### GitHub Actions Workflows
- `.github/workflows/deploy.yml` - Kubernetes deployment workflow that used kubectl to deploy applications

### Deployment Scripts
- `scripts/deploy.sh` - Kubernetes deployment script using kubectl and envsubst
- `scripts/setup-env.sh` - Kubernetes namespace and secret setup script
- `scripts/health-check.sh` - Kubernetes health check script using kubectl

### Example Configurations  
- `examples/ci-cd-workflow.yml` - Example Kubernetes deployment workflow for application repositories

## Removed Configuration Sections

### config.yaml
The following sections were removed from `config.yaml`:
- Environment-specific resource limits and replica counts (designed for Kubernetes pods)
- Monitoring namespace configuration 
- Network policies and pod security standards settings

## Rationale for Removal

These features were removed to:
1. **Simplify deployment** - Focus on Docker Compose and SSH-based deployments for MVP
2. **Reduce complexity** - Eliminate Kubernetes learning curve for team members
3. **Speed up deployment** - Remove orchestration complexity that's not needed initially
4. **Follow KISS principle** - Keep infrastructure as simple as possible for bootstrapping

## Recovery Instructions

If Kubernetes deployment is needed in the future:
1. Restore files from git history: `git show HEAD~1:path/to/file > restored_file`
2. Review and update configurations for current application needs
3. Test deployments in development environment before production use
4. Update documentation to include both deployment methods

## Current Deployment Methods

After removal, the repository supports:
1. **Docker Compose** - For local development and simple production deployments
2. **SSH-based Docker deployment** - For deploying to remote servers using Docker
3. **Docker image building** - Via GitHub Actions for CI/CD pipelines

## Maintained Scripts

The following deployment scripts were kept:
- `scripts/ssh-deploy.sh` - SSH-based Docker deployment
- `scripts/ssh-health-check.sh` - SSH-based health checks  
- `scripts/ssh-rollback.sh` - SSH-based rollback functionality
- `scripts/check-security.sh` - Security validation script