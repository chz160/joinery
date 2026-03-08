# OAuth Production Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire up GitHub OAuth authentication for production on App Runner with secrets in AWS Secrets Manager and build-time config injection for the Angular frontend.

**Architecture:** GitHub OAuth App handles user login. Server reads all secrets from a consolidated Secrets Manager secret. Web frontend gets non-sensitive config (API URL, client ID, redirect URI) injected as Docker build args during CI.

**Tech Stack:** GitHub CLI, AWS Secrets Manager, AWS App Runner, Docker build args, GitHub Actions workflows, Angular environments

---

### Task 1: Create GitHub OAuth App

**Step 1: Create the OAuth App via GitHub CLI**

Run:
```bash
gh api -X POST /user/applications \
  -f name="Joinery" \
  -f url="https://amkj3n4pw9.us-east-1.awsapprunner.com" \
  -f callback_url="https://dr2dbnqvs7.us-east-1.awsapprunner.com/signin-github"
```

Expected: JSON response with `client_id`. Save this value.

**Step 2: Generate a client secret**

Run (replace `CLIENT_ID` with the value from step 1):
```bash
gh api -X POST /applications/{CLIENT_ID}/token
```

Or generate via GitHub UI: Settings → Developer Settings → OAuth Apps → Joinery → Generate a new client secret.

Save the `client_secret` value — it's only shown once.

**Step 3: Store client ID as GitHub repo variable**

Run:
```bash
gh variable set GITHUB_OAUTH_CLIENT_ID --body "<client-id-from-step-1>"
```

**Step 4: Commit**

No code changes in this task — just external setup.

---

### Task 2: Consolidate Secrets Manager

**Step 1: Get the existing connection string**

Run:
```bash
aws secretsmanager get-secret-value --secret-id joinery/database --query SecretString --output text
```

Parse out the `connectionString` value.

**Step 2: Generate a JWT secret key**

Run:
```bash
openssl rand -base64 48
```

Save the output.

**Step 3: Create the consolidated secret**

Run (substitute actual values):
```bash
aws secretsmanager create-secret \
  --name joinery/config \
  --description "Joinery production configuration" \
  --secret-string '{
    "connectionString": "<existing-connection-string>",
    "githubClientId": "<client-id-from-task-1>",
    "githubClientSecret": "<client-secret-from-task-1>",
    "jwtSecretKey": "<generated-jwt-key>"
  }'
```

Save the new secret ARN from the response.

**Step 4: Delete the old secret**

Run:
```bash
aws secretsmanager delete-secret --secret-id joinery/database --force-delete-without-recovery
```

**Step 5: Commit**

No code changes — just AWS resource management.

---

### Task 3: Update Server App Runner Service

**Step 1: Update the server App Runner service**

Update the service with new secret mappings and CORS environment variable. Run:

```bash
aws apprunner update-service \
  --service-arn arn:aws:apprunner:us-east-1:832763959711:service/joinery-server/6b1fe9967d574de7ba65640cb44b6d85 \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "832763959711.dkr.ecr.us-east-1.amazonaws.com/joinery-server:latest",
      "ImageConfiguration": {
        "RuntimeEnvironmentVariables": {
          "ASPNETCORE_ENVIRONMENT": "Production",
          "Cors__AllowedOrigins__0": "https://amkj3n4pw9.us-east-1.awsapprunner.com"
        },
        "RuntimeEnvironmentSecrets": {
          "ConnectionStrings__DefaultConnection": "<new-secret-arn>:connectionString::",
          "Authentication__GitHub__ClientId": "<new-secret-arn>:githubClientId::",
          "Authentication__GitHub__ClientSecret": "<new-secret-arn>:githubClientSecret::",
          "JWT__SecretKey": "<new-secret-arn>:jwtSecretKey::"
        },
        "Port": "5256"
      },
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": true,
    "AuthenticationConfiguration": {
      "AccessRoleArn": "arn:aws:iam::832763959711:role/joinery-apprunner-ecr-role"
    }
  }'
```

**Step 2: Wait for the update to complete**

Run:
```bash
aws apprunner describe-service \
  --service-arn arn:aws:apprunner:us-east-1:832763959711:service/joinery-server/6b1fe9967d574de7ba65640cb44b6d85 \
  --query Service.Status
```

Expected: `RUNNING` after a few minutes.

**Step 3: Verify health check**

Run:
```bash
curl https://dr2dbnqvs7.us-east-1.awsapprunner.com/api/health
```

Expected: `{"status":"Healthy"}`

**Step 4: Commit**

No code changes — just AWS service configuration.

---

### Task 4: Create Web Environment Template

**Files:**
- Create: `web/src/environments/environment.prod.ts.template`
- Modify: `web/src/environments/environment.prod.ts`

**Step 1: Create the template file**

Create `web/src/environments/environment.prod.ts.template`:
```typescript
export const environment = {
  production: true,
  apiBaseUrl: '${API_BASE_URL}',
  oauth: {
    redirectUri: '${OAUTH_REDIRECT_URI}',
    github: {
      clientId: '${GITHUB_OAUTH_CLIENT_ID}',
      scope: 'user:email read:user'
    }
  }
};
```

**Step 2: Update environment.prod.ts with current App Runner URLs**

Update `web/src/environments/environment.prod.ts` as a working default:
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://dr2dbnqvs7.us-east-1.awsapprunner.com',
  oauth: {
    redirectUri: 'https://amkj3n4pw9.us-east-1.awsapprunner.com/auth/callback',
    github: {
      clientId: 'your-github-client-id-prod',
      scope: 'user:email read:user'
    }
  }
};
```

**Step 3: Commit**

```bash
git add web/src/environments/environment.prod.ts.template web/src/environments/environment.prod.ts
git commit -m "feat: add environment.prod.ts template for build-time config injection"
```

---

### Task 5: Update Web Dockerfile with Build Args

**Files:**
- Modify: `web/Dockerfile`

**Step 1: Add build args and envsubst to the Dockerfile**

Update the builder stage to accept build args and substitute them into the environment file before the Angular build:

```dockerfile
# Multi-stage build for Angular application
FROM node:20-alpine AS builder

# Build arguments for production environment configuration
ARG API_BASE_URL=https://dr2dbnqvs7.us-east-1.awsapprunner.com
ARG OAUTH_REDIRECT_URI=https://amkj3n4pw9.us-east-1.awsapprunner.com/auth/callback
ARG GITHUB_OAUTH_CLIENT_ID=your-github-client-id-prod

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies - using npm install to avoid the ci issue
RUN npm install

# Copy source code
COPY src/ src/
COPY angular.json ./
COPY tsconfig*.json ./
COPY public/ public/

# Inject production environment values from build args
RUN apk add --no-cache gettext && \
    export API_BASE_URL="${API_BASE_URL}" && \
    export OAUTH_REDIRECT_URI="${OAUTH_REDIRECT_URI}" && \
    export GITHUB_OAUTH_CLIENT_ID="${GITHUB_OAUTH_CLIENT_ID}" && \
    envsubst < src/environments/environment.prod.ts.template > src/environments/environment.prod.ts

# Build using npx to directly call Angular CLI
RUN npx --yes @angular/cli@20.3.2 build
```

The rest of the Dockerfile (nginx stage) stays the same.

**Step 2: Commit**

```bash
git add web/Dockerfile
git commit -m "feat: add Docker build args for production environment injection"
```

---

### Task 6: Update Web Build Workflow

**Files:**
- Modify: `.github/workflows/web-build.yml`

**Step 1: Add build-args to the docker build step**

Update the "Build and push Docker image" step in `web-build.yml`:

```yaml
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./web
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            API_BASE_URL=${{ vars.APPRUNNER_SERVER_URL }}
            OAUTH_REDIRECT_URI=${{ vars.APPRUNNER_WEB_URL }}/auth/callback
            GITHUB_OAUTH_CLIENT_ID=${{ vars.GITHUB_OAUTH_CLIENT_ID }}
```

**Step 2: Commit**

```bash
git add .github/workflows/web-build.yml
git commit -m "feat: pass environment config as Docker build args in web workflow"
```

---

### Task 7: End-to-End Verification

**Step 1: Push all changes and trigger builds**

```bash
git push
```

Both `server-build` and `web-build` workflows should trigger.

**Step 2: Verify web build injects correct values**

Check the GitHub Actions log for the web build — the `envsubst` step should show the substituted values.

**Step 3: Verify server health with new secrets**

```bash
curl https://dr2dbnqvs7.us-east-1.awsapprunner.com/api/health
```

**Step 4: Test the OAuth flow**

1. Navigate to `https://amkj3n4pw9.us-east-1.awsapprunner.com`
2. Click "Login with GitHub"
3. Should redirect to GitHub OAuth consent screen
4. After approving, should redirect back to the app with a valid session

**Step 5: Commit**

No code changes — just verification.
