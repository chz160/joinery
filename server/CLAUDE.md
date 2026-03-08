## Prime Directives (SOLID • DRY • KISS • Evolutionary Change)

You are contributing to a C#/.NET codebase. Follow these rules in this order of priority:

1) **Safety & Tests First**
   - Never change behavior without tests that prove the behavior.
   - If code is legacy/untested, write **characterization tests** before refactoring.
   - Add/expand unit tests for new code paths; prefer pure functions for core logic.

2) **DRY Above All**
   - Before writing anything, **search the repo** for similar code (name/sig/behavior). Reuse or extend before you rewrite.
   - If duplication is discovered, refactor to a single abstraction. Prefer small internal helpers over copy/paste.
   - If reuse would force leaky coupling, introduce an **interface** in the consuming layer and adapt.

3) **SOLID Design Rules**
   - **S**ingle Responsibility: Each class has one reason to change. If a class does logging + parsing, split them.
   - **O**pen/Closed: New behavior should come from extension (new types/strategies), not editing core switch/if ladders.
   - **L**iskov: No surprising pre/postcondition changes. Subtypes must be substitutable.
   - **I**nterface Segregation: Prefer small, focused interfaces. Avoid "fat" god interfaces.
   - **D**ependency Inversion: Depend on interfaces/abstractions. Inject via constructors; avoid hardwired statics/singletons.

4) **KISS: Keep It Simple, Stupid**
   - Simplicity beats cleverness. **Prefer the smallest, clearest solution that solves the problem well.**
   - If a solution needs a diagram to explain, it's probably too complex.
   - Avoid premature abstraction — don't introduce a pattern or interface unless it serves an immediate purpose.
   - Eliminate unnecessary indirection, inheritance, and "magic." Code should be self-evident to future maintainers.
   - Favor straightforward data flow and control structures over deeply nested logic or over-engineered solutions.
   - Simplicity ≠ naïveté: still enforce SRP, OCP, and DIP — but do it in the **least complex way possible**.

5) **Evolve, Don't Mutate**
   - Prefer **additive paths** (new types/adapters) over editing existing core code. Use the **Strangler Fig** approach:
     - Create a new implementation alongside old.
     - Write adapters/facades to route traffic.
     - Migrate callers gradually with feature flags.
     - Deprecate old paths with clear timelines.
   - Mark superseded APIs with `[Obsolete("Use XyzService2", error: false)]` and link to the replacement.

---

## Build, Test, and Run

- `cd server && dotnet restore && dotnet build`
- `dotnet test` (no test suite exists yet)
- `dotnet run` — starts on http://localhost:5256
- Swagger UI: http://localhost:5256/swagger
- Health check: http://localhost:5256/api/health
- `dotnet format JoineryServer.sln` — fix formatting
- `dotnet format JoineryServer.sln --verify-no-changes` — verify formatting

---

## Code Rules (quick checks you must self-enforce)

- **Constructor injection only**; no service locator anti-pattern.
- **No static mutable state**; prefer options/config & DI lifetimes.
- **No god classes** (> ~300 LoC or > ~7 public members without strong justification).
- **No long switch/if ladders** for behavior: use Strategy/State/Specification/Visitor if needed — but **only if needed** (KISS).
- **Pure core, impure edges**: core logic is side-effect free; I/O and frameworks live at boundaries.
- **Immutability by default**: make models/records immutable unless mutability is required.
- **CQS**: query methods don't mutate; command methods don't return domain data.
- **Mapping & validation**
  - Centralize mappers/validators; don't duplicate ad-hoc per feature.
  - Prefer FluentValidation (or existing project standard) over manual checks sprinkled across code.

---

## Key Files

- `Program.cs` — Application startup and DI configuration
- `Controllers/` — API endpoint definitions
- `Services/` — Business logic
- `Data/JoineryDbContext.cs` — Entity Framework DbContext
- `Data/Configurations/` — EF Core entity configurations
- `Models/` — Domain entities
- `Middleware/` — JWT, API key, session, rate limiting, CORS

---

## Conventional Commits (enforced)

Use: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `perf:`, `chore:`, `build:`.
