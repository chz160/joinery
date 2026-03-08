# Joinery

Joinery is a monorepo containing three components:

- **`server/`** — ASP.NET Core 8.0 Web API (C#/.NET)
- **`web/`** — Angular 20 frontend (TypeScript)
- **`infra/`** — Docker Compose deployment and scripts

## Domains

- **app.jnry.io** — Web frontend (App Runner)
- **api.jnry.io** — Server API (App Runner)

## Prime Directives (SOLID, DRY, KISS)

1. **Safety & Tests First** — Never change behavior without tests that prove the behavior
2. **DRY Above All** — Search the repo for similar code before writing anything new
3. **SOLID Design** — Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion
4. **KISS** — Prefer the smallest, clearest solution that solves the problem well
5. **Evolve, Don't Mutate** — Prefer additive paths over editing existing core code

## Conventional Commits

Use: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `perf:`, `chore:`, `build:`

## Detailed Instructions

See `.github/instructions/` for area-specific guidelines:
- `dotnet.instructions.md` — Server/C# rules (applies to `server/**`)
- `angular.instructions.md` — Web/Angular rules (applies to `web/**`)
