# Joinery

Joinery is a monorepo containing three components:

- **`server/`** — ASP.NET Core 8.0 Web API (C#/.NET)
- **`web/`** — Angular 20 frontend (TypeScript)
- **`infra/`** — Docker Compose deployment and scripts

## Prime Directives (SOLID, DRY, KISS)

1. **Safety & Tests First** — Never change behavior without tests that prove the behavior
2. **DRY Above All** — Search the repo for similar code before writing anything new
3. **SOLID Design** — Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion
4. **KISS** — Prefer the smallest, clearest solution that solves the problem well
5. **Evolve, Don't Mutate** — Prefer additive paths over editing existing core code

## Conventional Commits

Use: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `perf:`, `chore:`, `build:`

---

## Server (`server/`)

### Prerequisites
- .NET 8.0 SDK

### Build, Test, and Run
- `cd server && dotnet restore && dotnet build`
- `dotnet test` (no test suite exists yet)
- `dotnet run` — starts on http://localhost:5256
- Swagger UI: http://localhost:5256/swagger
- Health check: http://localhost:5256/api/health

### Code Quality
- `dotnet format JoineryServer.sln` — fix formatting
- `dotnet format JoineryServer.sln --verify-no-changes` — verify formatting
- `dotnet publish JoineryServer.csproj -c Release -o out` — production build

### Code Rules
- Constructor injection only; no service locator
- No static mutable state
- No god classes (>300 LoC or >7 public members)
- Pure core, impure edges: core logic is side-effect free; I/O at boundaries
- Immutability by default
- CQS: query methods don't mutate; command methods don't return domain data

### Key Files
- `server/Program.cs` — Application startup and DI configuration
- `server/Controllers/` — API endpoint definitions
- `server/Services/` — Business logic
- `server/Data/JoineryDbContext.cs` — Entity Framework DbContext
- `server/AGENTS.md` — Detailed technical guidelines and design patterns

---

## Web (`web/`)

### Prerequisites
- Node.js 20+, npm 10+

### Build, Test, and Run
- `cd web && npm install`
- `npm run build` — production build
- `npm test -- --no-watch --browsers=ChromeHeadless` — unit tests (16/17 pass, 1 known failure)
- `npm start` — dev server on http://localhost:4200

### Code Rules
- Standalone components only (no NgModules)
- Strict TypeScript with null safety
- Use `inject()` function for DI in newer code
- Prefer RxJS observables and `async` pipe in templates
- Use `ChangeDetectionStrategy.OnPush` where appropriate
- Always provide `trackBy` for `*ngFor` loops

### Key Files
- `web/src/app/app.routes.ts` — Routing configuration
- `web/src/app/app.config.ts` — Application configuration
- `web/src/app/shared/` — Shared services and models
- `web/src/styles.scss` — Global styles

### Architecture
- Feature-organized: `auth/`, `dashboard/`, `organizations/`, `teams/`, `queries/`, `landing/`
- Smart vs dumb component separation
- HTTP calls wrapped in services, not components
- Angular Material 20.2.x for UI

---

## Infrastructure (`infra/`)

### Local Development
- `docker-compose -f infra/docker-compose.yml up` — runs web, API, and PostgreSQL

### Deployment
- Docker images pushed to Docker Hub (`chz160/joinery-server`, `chz160/joinery-web`)
- Deployed via SSH + docker-compose to remote host
- Environments: staging, prod (configured in `infra/config.yaml`)
- Deployment scripts in `infra/scripts/`
