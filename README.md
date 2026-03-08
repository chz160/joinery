# Joinery

A platform for sharing and managing database queries with team collaboration, organization management, and Git repository integration.

## Architecture

Joinery is a monorepo with three components:

| Directory | Description | Tech Stack |
|-----------|-------------|------------|
| [`server/`](server/) | REST API with OAuth authentication, JWT security, and role-based access control | ASP.NET Core 8.0 (C#) |
| [`web/`](web/) | Frontend application for query management, team collaboration, and organization oversight | Angular 20 (TypeScript) |
| [`infra/`](infra/) | Docker Compose stack definition, deployment scripts, and base Docker configurations | Docker, Bash |

## Getting Started

### Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/)
- [Docker](https://docs.docker.com/get-docker/) (optional, for containerized development)

### Run with Docker Compose

```bash
docker-compose -f infra/docker-compose.yml up
```

This starts the full stack:
- Web UI: http://localhost
- API: http://localhost:5256
- PostgreSQL: localhost:5432

### Run Locally

**Server:**
```bash
cd server
dotnet restore
dotnet run
# API available at http://localhost:5256
# Swagger UI at http://localhost:5256/swagger
```

**Web:**
```bash
cd web
npm install
npm start
# App available at http://localhost:4200
```

> For full local dev instructions including GitHub OAuth App setup, see [CONTRIBUTING.md](CONTRIBUTING.md).

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

- **`server-build.yml`** — Builds and pushes the server image on `server/**` changes
- **`web-build.yml`** — Builds and pushes the web image on `web/**` changes
- **`deploy.yml`** — Deploys the full stack via SSH and docker-compose

### Docker Images

Each build pushes to three registries:

| Image | Docker Hub | ECR Public |
|-------|-----------|------------|
| **Server** | `chz160/joinery-server` | `public.ecr.aws/n4s7h4e9/joinery-server` |
| **Web** | `chz160/joinery-web` | `public.ecr.aws/n4s7h4e9/joinery-web` |

### Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `DOCKER_HUB_USERNAME` | Docker Hub login |
| `DOCKER_HUB_ACCESS_TOKEN` | Docker Hub access token |
| `AWS_ACCESS_KEY_ID` | AWS credentials for ECR push |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials for ECR push |
| `SSH_PRIVATE_KEY` | SSH key for deployment server |
| `SSH_HOST` | Deployment server hostname |
| `SSH_USER` | SSH username |
| `SSH_PORT` | SSH port (optional, defaults to 22) |

## Documentation

- [Contributing Guide](CONTRIBUTING.md) — Local development setup, GitHub OAuth App configuration
- [Server README](server/README.md) — API setup, endpoints, authentication configuration
- [Server Database Guide](server/DATABASE.md) — Schema and data model documentation
- [Server Git Integration](server/GIT_INTEGRATION.md) — Git repository integration for SQL queries
- [Web README](web/README.md) — Frontend setup, OAuth flow, API integration
- [Infrastructure README](infra/README.md) — Deployment scripts, Docker configuration

## License

[MIT](LICENSE)
