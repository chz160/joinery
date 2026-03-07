# Joinery Web

Joinery Web is the frontend application for the Joinery Server, providing a modern web interface for SQL query management, team collaboration, and organization oversight.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Frontend-Backend Integration

Joinery Web connects to the Joinery Server backend to provide authentication, data management, and API services. This section explains how the frontend interacts with the backend and how to configure the connection.

### Authentication Flow

The application supports OAuth-based authentication through multiple identity providers:

#### Supported OAuth Providers
- **Microsoft Entra ID** - Enterprise authentication
- **GitHub** - Developer-focused authentication  
- **AWS IAM** - Cloud-native authentication

#### Authentication Process

1. **OAuth Initialization**: User selects an OAuth provider on the login page
2. **Backend Redirect**: Frontend redirects to `/api/auth/{provider}` endpoint on the Joinery Server
3. **OAuth Flow**: User completes OAuth flow with the selected provider
4. **Token Exchange**: Joinery Server exchanges OAuth tokens for JWT tokens
5. **JWT Storage**: Frontend receives and stores JWT tokens for API authentication

#### JWT Token Handling

The application uses JSON Web Tokens (JWT) for authenticated API requests:

```typescript
// JWT tokens are stored securely and included in API requests
Authorization: Bearer <jwt-token>
```

**Token Storage**: JWTs are stored in secure HTTP-only cookies or localStorage (configurable)
**Token Refresh**: Automatic token refresh before expiration
**Token Validation**: Server-side validation on each request

### API Usage

The frontend communicates with the Joinery Server through RESTful API endpoints.

#### API Configuration

Configure the backend API base URL in your environment:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api' // Development
};

// src/environments/environment.prod.ts  
export const environment = {
  production: true,
  apiBaseUrl: 'https://your-joinery-server.com/api' // Production
};
```

#### API Service Implementation

The `Api` service handles all HTTP requests with automatic JWT injection:

```typescript
// Example API service usage
@Injectable({
  providedIn: 'root'
})
export class Api {
  constructor(private http: HttpClient) {}
  
  private get headers() {
    const token = this.getStoredToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  
  // GET request example
  getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${environment.apiBaseUrl}/organizations`, {
      headers: this.headers
    });
  }
  
  // POST request example
  createQuery(query: Partial<Query>): Observable<Query> {
    return this.http.post<Query>(`${environment.apiBaseUrl}/queries`, query, {
      headers: this.headers
    });
  }
}
```

### Sample API Endpoints

#### Authentication Endpoints
```
POST   /api/auth/login            # Standard login
GET    /api/auth/microsoft        # Microsoft OAuth login
GET    /api/auth/github           # GitHub OAuth login  
GET    /api/auth/aws              # AWS IAM login
POST   /api/auth/logout           # Logout
POST   /api/auth/refresh          # Token refresh
GET    /api/auth/me               # Get current user
```

#### Core Resource Endpoints
```
# Organizations
GET    /api/organizations         # List organizations
POST   /api/organizations         # Create organization
GET    /api/organizations/{id}    # Get organization
PUT    /api/organizations/{id}    # Update organization
DELETE /api/organizations/{id}    # Delete organization

# Teams  
GET    /api/teams                 # List teams
POST   /api/teams                 # Create team
GET    /api/teams/{id}            # Get team
PUT    /api/teams/{id}            # Update team
DELETE /api/teams/{id}            # Delete team

# Queries
GET    /api/queries               # List queries
POST   /api/queries               # Create query
GET    /api/queries/{id}          # Get query
PUT    /api/queries/{id}          # Update query
DELETE /api/queries/{id}          # Delete query
POST   /api/queries/{id}/execute  # Execute query

# Repositories
GET    /api/repositories          # List repositories
POST   /api/repositories          # Link repository
GET    /api/repositories/{id}     # Get repository
PUT    /api/repositories/{id}     # Update repository
DELETE /api/repositories/{id}     # Unlink repository
```

### Environment Configuration

#### Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure API URL**
   Create or update environment files:
   ```typescript
   // src/environments/environment.ts
   export const environment = {
     production: false,
     apiBaseUrl: 'http://localhost:3000/api',
     oauth: {
       redirectUri: 'http://localhost:4200/auth/callback'
     }
   };
   ```

3. **Start Development Server**
   ```bash
   ng serve
   ```

4. **Proxy Configuration** (Optional)
   Create `proxy.conf.json` for API proxying during development:
   ```json
   {
     "/api/*": {
       "target": "http://localhost:3000",
       "secure": false,
       "changeOrigin": true,
       "logLevel": "debug"
     }
   }
   ```

   Update `angular.json`:
   ```json
   "serve": {
     "builder": "@angular/build:dev-server",
     "options": {
       "proxyConfig": "proxy.conf.json"
     }
   }
   ```

#### Production Configuration

1. **Environment Variables**
   ```typescript
   // src/environments/environment.prod.ts
   export const environment = {
     production: true,
     apiBaseUrl: process.env['API_BASE_URL'] || 'https://api.joinery.com',
     oauth: {
       redirectUri: process.env['OAUTH_REDIRECT_URI'] || 'https://app.joinery.com/auth/callback'
     }
   };
   ```

2. **Build for Production**
   ```bash
   ng build --prod
   ```

### Error Handling

#### API Error Interceptor

The application includes comprehensive error handling for API requests:

```typescript
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        switch (error.status) {
          case 401:
            // Token expired or invalid - redirect to login
            this.router.navigate(['/auth/login']);
            break;
          case 403:
            // Forbidden - show access denied message
            this.notificationService.error('Access denied');
            break;
          case 500:
            // Server error - show generic error message
            this.notificationService.error('Server error occurred');
            break;
          default:
            // Handle other errors
            this.notificationService.error('An unexpected error occurred');
        }
        return throwError(() => error);
      })
    );
  }
}
```

#### Common Error Scenarios

**Authentication Errors**
- `401 Unauthorized`: Token expired or missing - user redirected to login
- `403 Forbidden`: Insufficient permissions - show access denied message

**Network Errors**  
- Connection timeout: Retry with exponential backoff
- Network unavailable: Show offline indicator

**Validation Errors**
- `400 Bad Request`: Display field-specific validation messages
- `422 Unprocessable Entity`: Show form validation errors

#### Retry Logic

```typescript
// Automatic retry for failed requests
return this.http.get(url).pipe(
  retryWhen(errors => 
    errors.pipe(
      delay(1000),
      take(3)
    )
  )
);
```

### Development Workflow

#### Connecting to Backend

1. **Start Joinery Server**
   ```bash
   # In your joinery-server directory
   npm start
   # Server typically runs on http://localhost:3000
   ```

2. **Configure Frontend**
   ```bash
   # In this directory  
   # Update src/environments/environment.ts with correct API URL
   npm start
   # Frontend runs on http://localhost:4200
   ```

3. **Verify Connection**
   - Open browser developer tools
   - Navigate to http://localhost:4200
   - Check Network tab for successful API calls
   - Verify authentication flow works end-to-end

#### Debugging Tips

- **Network Tab**: Monitor API requests/responses
- **Console Logs**: Check for authentication errors
- **Local Storage**: Verify JWT token storage
- **CORS Issues**: Ensure backend allows frontend origin
- **Proxy Setup**: Use Angular proxy for local development

For detailed backend setup instructions, refer to the [Joinery Server documentation](https://github.com/your-org/joinery-server).

## Docker & Infrastructure

### Dockerfile Ownership & Architecture Decision

This repository contains the `Dockerfile` for building the joinery-web container image. This architectural decision follows best practices for containerized applications:

**Why the Dockerfile lives in this repository:**
- **Code-Build Coupling**: Build configurations are versioned alongside the application code, ensuring consistency between code changes and build requirements
- **Developer Experience**: Developers can build and test the application locally using the same Dockerfile used in production
- **Atomic Changes**: Application changes and their corresponding build/deployment requirements can be updated together in a single commit
- **Simplified Debugging**: Build issues can be reproduced and debugged locally with the exact same configuration

**Infrastructure Separation**: While the Dockerfile lives here, orchestration, deployment workflows, and infrastructure configuration are managed in the separate [joinery-infra](https://github.com/chz160/joinery-infra) repository.

### Repository Structure & Responsibilities

#### This Repository (joinery-web)
```
joinery-web/
├── Dockerfile              # Container build configuration
├── nginx.conf             # Web server configuration  
├── src/                   # Angular application source
├── dist/                  # Build output (generated)
├── package.json           # Dependencies and build scripts
├── angular.json           # Angular CLI configuration
└── README.md             # This documentation
```

**Responsibilities:**
- Angular application source code
- Frontend build configuration (`angular.json`, `package.json`)
- Container build definition (`Dockerfile`)
- Web server configuration (`nginx.conf`)
- Local development setup

#### Infrastructure Repository (joinery-infra)
**Responsibilities:**
- Docker Compose configurations for different environments
- CI/CD pipeline definitions
- Infrastructure provisioning (Terraform, CloudFormation, etc.)
- Environment-specific configurations
- Orchestration and deployment workflows
- Monitoring and logging configuration

### Example Docker Integration

#### Building the Application Container

```bash
# Build the Docker image locally
docker build -t chz160/joinery-web:latest .

# Run the container locally
docker run -p 8080:80 \
  -e API_URL=http://localhost:3000 \
  chz160/joinery-web:latest
```

#### Docker Compose Integration (from joinery-infra)

The infrastructure repository contains Docker Compose configurations that reference this image:

```yaml
# Example from joinery-infra/docker-compose.yml
version: '3.8'

services:
  web:
    image: chz160/joinery-web:latest
    ports:
      - "80:80"
    environment:
      - API_URL=http://api:5256
      - OAUTH_REDIRECT_URI=http://localhost:4200/auth/callback
    depends_on:
      - api
    networks:
      - joinery-network

  api:
    image: chz160/joinery-server:latest
    ports:
      - "5256:5256"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/joinery
    networks:
      - joinery-network

networks:
  joinery-network:
    driver: bridge
```

### CI/CD Workflow Integration

The relationship between repositories in the CI/CD pipeline:

1. **Code Changes**: Developers commit changes to `joinery-web`
2. **Image Build**: GitHub Actions builds and pushes container image to registry
3. **Infrastructure Deployment**: `joinery-infra` repository references the new image tag
4. **Orchestration**: Docker Compose or Kubernetes manifests deploy the updated stack

#### Typical Workflow
```bash
# 1. Developer workflow (this repo)
git commit -m "feat: add new feature"
git push origin main

# 2. CI builds and pushes image
# → docker build -t chz160/joinery-web:v1.2.3
# → docker push chz160/joinery-web:v1.2.3

# 3. Infrastructure update (joinery-infra repo)
# → Update image tag in docker-compose.yml or k8s manifests
# → Deploy updated stack
```

### Local Development with Docker

For local development using Docker:

```bash
# Option 1: Use docker-compose from joinery-infra
git clone https://github.com/chz160/joinery-infra
cd joinery-infra
docker-compose up

# Option 2: Build and run locally
cd joinery-web
docker build -t joinery-web-local .
docker run -p 8080:80 joinery-web-local
```

### Environment Configuration

The containerized application accepts environment variables for runtime configuration:

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | Backend API base URL | `http://api:5256` |
| `OAUTH_REDIRECT_URI` | OAuth callback URL | `http://localhost:4200/auth/callback` |
| `NODE_ENV` | Runtime environment | `production` |

For comprehensive infrastructure setup, deployment guides, and orchestration examples, see the [joinery-infra repository](https://github.com/chz160/joinery-infra).

## CI/CD and Docker Hub Integration

### GitHub Actions Workflow

The repository includes a GitHub Actions workflow that automatically builds and publishes Docker images. The workflow supports **conditional registry selection** - it can publish to Docker Hub or an on-premises registry based on the secrets configured.

#### Registry Selection Logic

The workflow automatically determines which registry to use based on available secrets:

1. **Docker Hub** (preferred): If both `DOCKER_HUB_USERNAME` and `DOCKER_HUB_ACCESS_TOKEN` are configured
2. **On-Premises Registry**: If `DOCKER_REGISTRY_URL` is configured (along with registry credentials)
3. **Error**: If no valid registry configuration is found

#### Required GitHub Secrets

Configure these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

##### Option 1: Docker Hub Registry

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `DOCKER_HUB_USERNAME` | Your Docker Hub username | `your-dockerhub-username` |
| `DOCKER_HUB_ACCESS_TOKEN` | Your Docker Hub access token | `dckr_pat_abc123...` |

##### Option 2: On-Premises Registry

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `DOCKER_REGISTRY_URL` | Your private registry URL | `registry.company.com` |
| `DOCKER_REGISTRY_USERNAME` | Registry username | `deploy-user` |
| `DOCKER_REGISTRY_PASSWORD` | Registry password or token | `secure-password` |

> **Note**: The workflow will prioritize Docker Hub if both configurations are present.

#### Image Tagging Strategy

The workflow automatically creates multiple tags for each build:

- `latest` - Latest build from main branch
- `<commit-sha>` - Full commit SHA for precise versioning
- `main-<commit-sha>` - Specific commit from main branch  
- `<branch-name>` - Latest build from feature branches
- `pr-<number>` - Pull request builds (not pushed to registry)

#### Registry Usage Examples

The usage depends on which registry is configured:

##### Docker Hub Usage
```bash
# Pull latest image (Docker Hub)
docker pull your-username/joinery-web:latest

# Pull specific commit
docker pull your-username/joinery-web:abc1234567890

# Run the container
docker run -p 8080:80 your-username/joinery-web:latest
```

##### On-Premises Registry Usage
```bash
# Pull latest image (on-prem)
docker pull registry.company.com/joinery-web:latest

# Pull specific commit
docker pull registry.company.com/joinery-web:abc1234567890

# Run the container
docker run -p 8080:80 registry.company.com/joinery-web:latest
```

##### Docker Compose Integration
```yaml
# Example from joinery-infra/docker-compose.yml
services:
  web:
    # Docker Hub
    image: your-username/joinery-web:latest
    # OR On-premises
    # image: registry.company.com/joinery-web:latest
    ports:
      - "80:80"
```

#### Build Process

The CI/CD pipeline:

1. **Triggers**: Runs on push to main branch and pull requests
2. **Registry Detection**: Automatically determines target registry based on configured secrets
3. **Authentication**: Logs into the selected registry (Docker Hub or on-premises)
4. **Build**: Creates production-optimized Angular build using multi-stage Docker build
5. **Security**: Runs as non-root nginx user with health checks
6. **Caching**: Uses GitHub Actions cache to speed up builds
7. **Publishing**: Pushes to the selected registry with multiple tags
8. **Reporting**: Provides deployment summary with registry info and available tags

#### Registry Selection Logs

The workflow provides clear logging about which registry is being used:

- `🐳 Using Docker Hub registry` - When Docker Hub secrets are detected
- `🏢 Using on-premises registry: <URL>` - When on-prem registry is configured  
- `❌ No registry configuration found` - When no valid secrets are present
