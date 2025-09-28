import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Configuration service for application settings.
 * Follows KISS principle - simple, centralized configuration management.
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  /**
   * API base URL for backend services
   */
  get apiBaseUrl(): string {
    return environment.apiBaseUrl;
  }

  /**
   * OAuth configuration
   */
  get oauth() {
    return {
      redirectUri: environment.oauth.redirectUri,
      github: {
        clientId: environment.oauth.github.clientId,
        scope: environment.oauth.github.scope,
        isConfigured: this.isGitHubOAuthConfigured()
      }
    };
  }

  /**
   * Check if GitHub OAuth is properly configured
   */
  isGitHubOAuthConfigured(): boolean {
    return !!(environment.oauth?.github?.clientId && 
              environment.oauth.github.clientId !== 'your-github-client-id');
  }

  /**
   * Check if application is in production mode
   */
  get isProduction(): boolean {
    return environment.production;
  }

  /**
   * Check if demo mode should be available
   */
  get isDemoEnabled(): boolean {
    // Demo is available in development or when OAuth is not configured
    return !this.isProduction || !this.isGitHubOAuthConfigured();
  }
}