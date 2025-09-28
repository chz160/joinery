# Joinery Web - Angular Frontend Application

Joinery Web is the frontend application for the Joinery Server, providing a modern Angular-based web interface for SQL query management, team collaboration, and organization oversight.

**ALWAYS follow these instructions first and only fall back to search or bash commands when you encounter unexpected information that does not match the details provided here.**

## Project Context and Goals

### Project Overview
Joinery Web is a collaborative SQL query management platform designed for:
- **Teams and Organizations**: Multi-level team structure with role-based access control
- **Educational Institutions**: Classroom and research collaboration
- **Open Source**: MIT licensed with transparent development practices
- **Security First**: Enterprise-grade authentication and data privacy

### Key Features Being Built
- GitHub/OAuth authentication integration
- Organization and team management
- Query sharing and collaboration
- Repository integration (GitHub, GitLab)
- Audit trails and compliance reporting
- REST API for extensibility

### Target Users
- Database administrators and analysts
- Software development teams
- Educational institutions and students
- Research organizations
- Any team needing secure SQL collaboration

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
   - **I**nterface Segregation: Prefer small, focused interfaces. Avoid “fat” god interfaces.
   - **D**ependency Inversion: Depend on interfaces/abstractions. Inject via constructors; avoid hardwired statics/singletons.

4) **KISS: Keep It Simple, Stupid**
   - Simplicity beats cleverness. **Prefer the smallest, clearest solution that solves the problem well.**
   - If a solution needs a diagram to explain, it’s probably too complex.
   - Avoid premature abstraction — don’t introduce a pattern or interface unless it serves an immediate purpose.
   - Eliminate unnecessary indirection, inheritance, and “magic.” Code should be self-evident to future maintainers.
   - Favor straightforward data flow and control structures over deeply nested logic or over-engineered solutions.
   - Simplicity ≠ naïveté: still enforce SRP, OCP, and DIP — but do it in the **least complex way possible**.

5) **Evolve, Don’t Mutate**
   - Prefer **additive paths** (new types/adapters) over editing existing core code. Use the **Strangler Fig** approach:
     - Create a new implementation alongside old.
     - Write adapters/facades to route traffic.
     - Migrate callers gradually with feature flags.
     - Deprecate old paths with clear timelines.
   - Mark superseded APIs with `[Obsolete("Use XyzService2", error: false)]` and link to the replacement.

---

## Change Protocol (You must follow this order)

1) **Understand**
   - Restate the user story/bug and acceptance criteria.
   - List inputs/outputs, side effects, and cross-cutting concerns (perf, security, PII).

2) **Inventory & Reuse Check**
   - Search for existing: services, strategies, validators, mappers, options, policies, extension methods.
   - List candidates with file paths and explain reuse plan or why not.

3) **Design Sketch**
   - Propose a **minimal, SOLID, DRY, and KISS-compliant design**:
     - New interfaces (names, members).
     - New classes (responsibility in one sentence).
     - Where dependencies are injected (constructor signatures).
     - How old code is adapted or routed.
   - Provide a dependency diagram (mermaid) showing direction **toward abstractions**.

4) **Risk & Migration Plan**
   - Identify blast radius and rollback plan.
   - Flag and propose **feature toggles** or config gates for new behavior.
   - Note deprecations (what/when/how measured).

5) **Test Plan (must be concrete)**
   - List unit tests to add (method names, cases, edge cases).
   - List integration tests to add or update.
   - Define invariants and expected exceptions.
   - If refactor-only: create characterization tests first.

6) **Implementation**
   - Implement the **simplest, smallest valuable slice first**.
   - Keep methods small (<25 lines when practical). No magic numbers. Guard clauses allowed.
   - Prefer composition over inheritance; avoid static state.

7) **Validation**
   - Run/describe how tests pass.
   - Show duplication eliminated (before/after paths).
   - Provide perf/security notes if relevant.

---

## Your Final Self-Review (must pass before completion)

- ✅ Did I **reuse** something instead of writing new?
- ✅ Did I **add tests first** (or characterization) before refactor?
- ✅ Are classes/methods **single-purpose** and small?
- ✅ Did I **extend** instead of editing a stable core?
- ✅ Are dependencies **inverted and injected**?
- ✅ Did I **avoid duplication** and centralize cross-cutting concerns?
- ✅ Did I **keep it as simple as possible** while still SOLID and DRY?

---

## Working Effectively

### Bootstrap and Setup
- **Install Dependencies**: `npm install` -- takes approximately 47 seconds. NEVER CANCEL - set timeout to 120+ seconds.
- **Node.js Version**: Requires Node.js 20+ and npm 10+. The application uses Angular CLI version 20.3.2.

### Building the Application
- **Development Build**: `npm run build` -- takes approximately 8.5 seconds. NEVER CANCEL - set timeout to 60+ seconds.
- **Watch Mode**: `npm run watch` -- builds with file watching for development.
- **Production Build**: `ng build --configuration production` -- same timing as development build.
- **Build Output**: Generated in `/dist/joinery-web-temp/` directory.
- **Bundle Size Warning**: Normal to see bundle size warnings (~750kB initial vs 500kB budget) - this is expected and not a build failure.

### Running Tests
- **Unit Tests**: `npm test -- --no-watch --browsers=ChromeHeadless` -- takes approximately 14 seconds. NEVER CANCEL - set timeout to 60+ seconds.
- **Test Results**: Expect 16/17 tests to pass. One test fails due to missing h1 element in app template - this is known and does not affect functionality.
- **Interactive Tests**: `npm test` (omit --no-watch for interactive mode).
- **Test Framework**: Uses Karma with Jasmine for unit testing.

### Development Server
- **Start Server**: `npm start` or `npm run start` -- development server starts in approximately 6 seconds. NEVER CANCEL - set timeout to 60+ seconds.
- **Server URL**: Application runs on `http://localhost:4200` by default.
- **Hot Reload**: Automatic file watching and live reload enabled.
- **Custom Host/Port**: Use `npm start -- --host=0.0.0.0 --port=4200` for custom configuration.

## Validation Scenarios

**ALWAYS manually validate changes by running through these complete user scenarios:**

### Essential User Flows to Test
1. **Landing Page Navigation**: 
   - Navigate to `http://localhost:4200`
   - Verify landing page loads with Joinery branding, value proposition, and feature highlights
   - Test "Learn More" button navigation to dashboard
   - Test "Sign in with GitHub" button functionality

2. **Dashboard Functionality**:
   - Navigate to `/dashboard` 
   - Verify dashboard displays welcome message, metrics cards (Organizations: 3, Teams: 8, Queries: 42, Repositories: 15)
   - Check Recent Activity section with sample data
   - Test action buttons: "Create New Query", "New Organization", "Invite Team Members"

3. **Navigation Testing**:
   - Toggle side navigation menu
   - Navigate to all main routes: `/dashboard`, `/organizations`, `/teams`, `/queries`, `/auth/login`
   - Verify each route loads appropriate content

4. **Component Verification**:
   - Organizations page should show "Loading organizations..." state
   - All pages should display proper Material Design styling
   - Mobile responsiveness check (side nav converts to overlay)

## Application Structure

### Key Directories
- `/src/app/` - Main application code
- `/src/app/landing/` - Landing page component
- `/src/app/dashboard/` - Dashboard component with metrics
- `/src/app/auth/` - Authentication components and services
- `/src/app/organizations/` - Organization management
- `/src/app/teams/` - Team management
- `/src/app/queries/` - Query browser and management
- `/src/app/shared/` - Shared services and models

### Important Files
- `package.json` - Dependencies and scripts
- `angular.json` - Angular CLI configuration
- `src/app/app.routes.ts` - Application routing
- `src/app/app.config.ts` - Application configuration
- `src/styles.scss` - Global styles

### Technology Stack
- **Framework**: Angular 20.3.x with standalone components
- **UI Library**: Angular Material 20.2.x
- **Styling**: SCSS with Material Design
- **Testing**: Karma + Jasmine
- **Build System**: Angular CLI with Vite

## Common Issues and Troubleshooting

### Known Issues
- **Failing Test**: One test fails expecting "Hello, joinery-web-temp" in h1 element - this is expected as the actual app template uses different content.
- **Bundle Size Warning**: Expected warning about 750kB bundle exceeding 500kB budget - does not prevent successful build.

### Backend Integration
- **API Configuration**: Ready for backend integration via environment configuration
- **Expected Backend URL**: `http://localhost:3000/api` for development
- **Proxy Support**: Can be configured via `proxy.conf.json` if needed
- **Environment Files**: Currently no environment files exist - create as needed for API integration

### Development Tips
- **Hot Reload**: File changes trigger automatic rebuilds and browser refresh
- **Component Generation**: Use `ng generate component <name>` for new components
- **Service Generation**: Use `ng generate service <name>` for new services
- **Routing**: All routes configured in `src/app/app.routes.ts`

### Performance Notes
- **First Build**: Initial npm install takes ~47 seconds due to dependency resolution
- **Subsequent Builds**: Development builds complete in ~8.5 seconds
- **Test Suite**: Completes in ~14 seconds with Chrome Headless
- **Dev Server Startup**: Ready in ~6 seconds after build completion

## Validation Checklist

Before completing any changes, ALWAYS:
- [ ] Run `npm install` to ensure dependencies are current
- [ ] Run `npm run build` and verify successful completion (ignore bundle size warning)
- [ ] Run `npm test -- --no-watch --browsers=ChromeHeadless` and verify 16/17 tests pass
- [ ] Start development server with `npm start`
- [ ] Navigate through all main routes: landing, dashboard, organizations, teams, queries
- [ ] Test navigation menu functionality
- [ ] Verify responsive design on different screen sizes
- [ ] Check browser console for any unexpected errors
- [ ] Test at least one complete user scenario from the validation list above

## Code Quality

### Formatting
- **Prettier Configuration**: Built into package.json with printWidth: 100, singleQuote: true
- **Angular Templates**: Uses Angular parser for HTML formatting

### Architecture
- **Standalone Components**: Uses Angular's modern standalone component architecture
- **Material Design**: Consistent UI with Angular Material components
- **Routing**: Lazy-loaded routes for better performance
- **Services**: Shared services in `/shared/services/` directory

### File Naming Convention
- Components: `component-name.ts`, `component-name.html`, `component-name.scss`, `component-name.spec.ts`
- Services: `service-name.ts`, `service-name.spec.ts`
- All files use kebab-case naming

## TypeScript and Angular Best Practices

### Code Quality Standards
- **Type Safety**: Always use explicit types, avoid `any` unless absolutely necessary
- **Strict Mode**: Project uses strict TypeScript configuration - respect all compiler warnings
- **Null Safety**: Use strict null checks, prefer optional chaining `?.` and nullish coalescing `??`
- **Immutability**: Prefer `readonly` properties and immutable data patterns where possible

### Angular-Specific Guidelines
- **Standalone Components**: Always use Angular's standalone component architecture (no NgModules)
- **Dependency Injection**: Use constructor injection for services, prefer `inject()` function in newer code
- **Reactive Patterns**: Use RxJS observables for async operations, prefer `async` pipe in templates
- **OnPush Strategy**: Use `ChangeDetectionStrategy.OnPush` for performance when appropriate
- **Track By Functions**: Always provide `trackBy` functions for `*ngFor` loops with dynamic data

### Component Architecture
- **Single Responsibility**: Components should have one clear purpose
- **Smart vs Dumb**: Separate container (smart) components from presentation (dumb) components
- **Input/Output**: Use `@Input()` and `@Output()` for component communication
- **Signal-Based**: Prefer Angular Signals over traditional property binding where applicable
- **Lifecycle Hooks**: Implement only needed lifecycle hooks, prefer `OnDestroy` for cleanup

### Service Design
- **Injectable Services**: All services must use `@Injectable()` decorator
- **Singleton Pattern**: Services are typically singletons provided at root level
- **HTTP Services**: Wrap HTTP calls in services, not components
- **Error Handling**: Implement proper error handling with RxJS operators like `catchError`
- **State Management**: Keep component state local, share global state through services

### Testing Standards
- **Unit Tests**: Every component and service must have corresponding `.spec.ts` files
- **Test Coverage**: Aim for meaningful tests, not just coverage percentages
- **TestBed**: Use Angular TestBed for component testing
- **Mocking**: Mock dependencies properly using spies and stubs
- **Async Testing**: Use `fakeAsync` and `tick` for testing async operations

### Performance Guidelines
- **Lazy Loading**: Use lazy-loaded routes for feature modules
- **Bundle Optimization**: Keep bundle sizes reasonable, current warning at 750kB is acceptable
- **OnPush Detection**: Use OnPush change detection for performance-critical components
- **Template Optimization**: Avoid complex expressions in templates
- **Memory Leaks**: Always unsubscribe from observables in `ngOnDestroy`

### Code Organization Patterns
- **Feature Modules**: Organize code by features, not by file types
- **Shared Components**: Place reusable components in `/shared/components/`
- **Core Services**: Place singleton services in `/shared/services/`
- **Models**: Define interfaces and types in `/shared/models/`
- **Constants**: Use enums and constants instead of magic strings/numbers

### Security Best Practices
- **XSS Prevention**: Never use `innerHTML` with dynamic content, prefer `textContent`
- **CSP Compliance**: Avoid inline styles and scripts
- **HTTP Security**: Use HTTPS for all API calls, implement proper CORS handling
- **Authentication**: Store JWT tokens securely, implement proper logout
- **Input Validation**: Validate all user inputs both client-side and expect server-side validation

### Debugging and Development
- **Chrome DevTools**: Use Angular DevTools browser extension for debugging
- **Source Maps**: Leverage source maps for debugging in development
- **Console Logging**: Use appropriate log levels, remove console statements before production
- **Network Inspection**: Monitor HTTP requests in browser Network tab
- **Performance Profiling**: Use Angular DevTools Profiler for performance analysis

## Git and Collaboration

### Conventional Commits
Use the following commit message format:
- `feat:` - new features or enhancements
- `fix:` - bug fixes
- `docs:` - documentation changes
- `style:` - code formatting, missing semicolons, etc.
- `refactor:` - code refactoring without changing functionality
- `test:` - adding or updating tests
- `chore:` - maintenance tasks, dependency updates
- `perf:` - performance improvements

Examples:
- `feat: add user authentication service`
- `fix: resolve routing issue in dashboard component`
- `docs: update API integration examples`
- `refactor: extract common validation logic to service`

### Code Review Guidelines
- **Small PRs**: Keep pull requests focused and small for easier review
- **Self-Review**: Always review your own changes before submitting
- **Tests**: Include tests for new functionality
- **Documentation**: Update relevant documentation for significant changes
- **Breaking Changes**: Clearly mark and document any breaking changes

### Dependencies and Security
- **Dependency Updates**: Keep dependencies up to date, test thoroughly after updates
- **Security Audits**: Run `npm audit` regularly and fix security vulnerabilities
- **Lock Files**: Always commit `package-lock.json` changes
- **Peer Dependencies**: Ensure Angular and Material versions are compatible