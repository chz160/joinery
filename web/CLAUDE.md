## Angular 20 Frontend

You are contributing to an Angular 20 frontend application using TypeScript and Angular Material.

## Build, Test, and Run

- `cd web && npm install`
- `npm run build` — production build
- `npm test -- --no-watch --browsers=ChromeHeadless` — unit tests
- `npm start` — dev server on http://localhost:4200

---

## Code Rules

- **Standalone components only** — no NgModules
- **Strict TypeScript** with null safety enabled
- **`inject()` function** for dependency injection, not constructor injection
- **RxJS observables** and `async` pipe in templates for data binding
- **`ChangeDetectionStrategy.OnPush`** where appropriate
- **`trackBy`** required for all `*ngFor` loops
- **Smart vs dumb component separation** — smart components manage state, dumb components are pure inputs/outputs
- **HTTP calls in services only** — never directly in components
- **Angular Material 20.2.x** for UI components

---

## Architecture

- Feature-organized modules: `auth/`, `dashboard/`, `organizations/`, `teams/`, `queries/`, `landing/`
- Shared services and models in `shared/`
- Environment config in `src/environments/`
- `environment.prod.ts.template` uses `envsubst` for build-time injection — don't hardcode prod values

---

## Key Files

- `src/app/app.routes.ts` — Routing configuration
- `src/app/app.config.ts` — Application configuration
- `src/app/shared/services/` — Shared services (auth, config, API, etc.)
- `src/environments/` — Environment configs (dev and prod)
- `src/styles.scss` — Global styles

---

## Conventional Commits (enforced)

Use: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `perf:`, `chore:`, `build:`.
