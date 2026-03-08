# OAuth Production Setup Design

## Overview

Wire up GitHub OAuth authentication for production by creating the OAuth App, consolidating secrets in AWS Secrets Manager, and injecting configuration at build time for the Angular frontend.

## Step 1: Create GitHub OAuth App

Create an OAuth App under the personal GitHub account via `gh` CLI.

- **Name**: Joinery
- **Homepage URL**: `https://amkj3n4pw9.us-east-1.awsapprunner.com`
- **Callback URL**: `https://dr2dbnqvs7.us-east-1.awsapprunner.com/signin-github`
- The callback points to the server App Runner, not the web frontend. The .NET backend handles the OAuth code exchange with GitHub, then redirects to the Angular app.
- Generate a client secret after creation.
- Store the client ID as a GitHub repo variable (`GITHUB_OAUTH_CLIENT_ID`) since it's non-sensitive.

## Step 2: Consolidate Secrets Manager

Replace the existing `joinery/database` secret with a consolidated `joinery/config` secret containing all production secrets:

| Key | Description |
|-----|-------------|
| `connectionString` | PostgreSQL connection string (existing) |
| `githubClientId` | GitHub OAuth App client ID |
| `githubClientSecret` | GitHub OAuth App client secret |
| `jwtSecretKey` | 256-bit random key for JWT signing |

The server App Runner service already has `joinery-apprunner-instance-role` with Secrets Manager read access. Update `RuntimeEnvironmentSecrets` to map:

- `Authentication__GitHub__ClientId` -> `joinery/config:githubClientId`
- `Authentication__GitHub__ClientSecret` -> `joinery/config:githubClientSecret`
- `JWT__SecretKey` -> `joinery/config:jwtSecretKey`
- `ConnectionStrings__DefaultConnection` -> `joinery/config:connectionString`

## Step 3: Web Build-time Config Injection

The Angular `environment.prod.ts` needs three values injected at Docker build time.

### Approach: Docker Build Args

1. Create `environment.prod.ts.template` with placeholder tokens that get replaced during Docker build.
2. Add `ARG` directives to the web Dockerfile for `API_BASE_URL`, `OAUTH_REDIRECT_URI`, and `GITHUB_OAUTH_CLIENT_ID`.
3. Add a build step that substitutes the tokens before the Angular build runs.
4. Update `web-build.yml` to pass GitHub repo variables as `--build-arg` values.

### GitHub Repo Variables (non-sensitive)

- `APPRUNNER_SERVER_URL` — already set
- `APPRUNNER_WEB_URL` — already set
- `GITHUB_OAUTH_CLIENT_ID` — new, from Step 1

## Step 4: Update Server App Runner

- Update `RuntimeEnvironmentSecrets` with new key mappings from `joinery/config`.
- Add `Cors__AllowedOrigins__0` as a regular environment variable pointing to the web App Runner URL (`https://amkj3n4pw9.us-east-1.awsapprunner.com`).

## Decisions

- **One secret, multiple keys** over separate secrets — cheaper ($0.40/month for one vs multiple) and simpler.
- **Build-time injection** over runtime config — standard Angular pattern, no extra moving parts.
- **Client ID in repo variables** not secrets — it's public by design (visible in the OAuth redirect URL in the browser).
- **CORS origin as env var** not in Secrets Manager — it's a public URL, not sensitive.
