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

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

- **`server-build.yml`** — Builds and pushes `chz160/joinery-server` to Docker Hub on `server/**` changes
- **`web-build.yml`** — Builds and pushes `chz160/joinery-web` to Docker Hub on `web/**` changes
- **`deploy.yml`** — Deploys the full stack via SSH and docker-compose

### Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `DOCKER_HUB_USERNAME` | Docker Hub login |
| `DOCKER_HUB_ACCESS_TOKEN` | Docker Hub access token |
| `SSH_PRIVATE_KEY` | SSH key for deployment server |
| `SSH_HOST` | Deployment server hostname |
| `SSH_USER` | SSH username |
| `SSH_PORT` | SSH port (optional, defaults to 22) |

## Documentation

- [Server README](server/README.md) — API setup, endpoints, authentication configuration
- [Server Database Guide](server/DATABASE.md) — Schema and data model documentation
- [Server Git Integration](server/GIT_INTEGRATION.md) — Git repository integration for SQL queries
- [Web README](web/README.md) — Frontend setup, OAuth flow, API integration
- [Infrastructure README](infra/README.md) — Deployment scripts, Docker configuration

## License

[MIT](LICENSE)
