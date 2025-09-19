# Joinery Web - Angular Frontend Application

Joinery Web is the frontend application for the Joinery Server, providing a modern Angular-based web interface for SQL query management, team collaboration, and organization oversight.

**ALWAYS follow these instructions first and only fall back to search or bash commands when you encounter unexpected information that does not match the details provided here.**

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