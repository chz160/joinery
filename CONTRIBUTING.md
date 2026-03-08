# Contributing to Joinery

Thank you for your interest in contributing! This guide covers everything you need to get a full local development environment running.

## Local Development Setup

### Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/) and npm 10+
- A GitHub account (for OAuth login)

### 1. Clone the repository

```bash
git clone https://github.com/chz160/joinery.git
cd joinery
```

### 2. Set up the backend server

```bash
cd server
dotnet restore
dotnet run
# API available at http://localhost:5256
# Swagger UI at http://localhost:5256/swagger
```

The server falls back to an **in-memory database** when no `ConnectionStrings:DefaultConnection` is configured, so no PostgreSQL setup is required for local development.

### 3. Set up the frontend

```bash
cd web
npm install
npm start
# App available at http://localhost:4200
```

The environment file at `web/src/environments/environment.ts` already points to `http://localhost:5256/api` (the correct local server URL).

### 4. Set up a local GitHub OAuth App

GitHub OAuth is required for the login flow. Follow these steps to create a dev OAuth App:

1. Go to [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers) and click **New OAuth App**.
2. Fill in the form:
   | Field | Value |
   |---|---|
   | **Application name** | `Joinery (local dev)` |
   | **Homepage URL** | `http://localhost:4200` |
   | **Authorization callback URL** | `http://localhost:4200/auth/callback` |
3. Click **Register application**.
4. Copy the **Client ID** and generate a **Client Secret**.

#### Configure the frontend

Open `web/src/environments/environment.ts` and replace the placeholder:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5256/api',
  oauth: {
    redirectUri: 'http://localhost:4200/auth/callback',
    github: {
      clientId: '<your-client-id-here>',  // ← paste your Client ID
      scope: 'user:email read:user'
    }
  }
};
```

#### Configure the backend server

Add a `server/appsettings.Development.json` entry (create the file if it does not exist):

```json
{
  "Authentication": {
    "GitHub": {
      "ClientId": "<your-client-id-here>",
      "ClientSecret": "<your-client-secret-here>"
    }
  }
}
```

> **Note:** `appsettings.Development.json` is listed in `.gitignore` — never commit OAuth secrets.

### 5. Verify the setup

1. Open `http://localhost:4200` in your browser.
2. Click **Sign in with GitHub**.
3. Authorize the local OAuth App.
4. You should be redirected back to the app and logged in.

Use the browser **Network** tab to confirm API calls reach `http://localhost:5256/api`.

## Code Quality

### Backend (C#)

```bash
cd server
dotnet format JoineryServer.sln --verify-no-changes   # check formatting
dotnet format JoineryServer.sln                        # auto-fix formatting
dotnet build                                           # build
```

### Frontend (TypeScript / Angular)

```bash
cd web
npm run build          # production build
npm test -- --no-watch --browsers=ChromeHeadless   # unit tests
```

## Commit Messages

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code change that neither fixes a bug nor adds a feature |
| `test:` | Adding or updating tests |
| `docs:` | Documentation changes |
| `perf:` | Performance improvements |
| `chore:` | Maintenance tasks |
| `build:` | Build system or dependency changes |
