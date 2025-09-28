import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../shared/models';
import { environment } from '../../../environments/environment';

/**
 * Response interface for OAuth token exchange
 */
export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  user: User;
}

/**
 * Service responsible for OAuth flows and backend authentication.
 * Follows Single Responsibility Principle - only handles OAuth operations.
 */
@Injectable({
  providedIn: 'root'
})
export class OAuthService {
  private oauthState: string | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Initiate GitHub OAuth flow
   * @throws Error if OAuth is not properly configured
   */
  initiateGitHubOAuth(): void {
    // Check if OAuth is configured
    if (!environment.oauth?.github?.clientId || environment.oauth.github.clientId === 'your-github-client-id') {
      throw new Error('GitHub OAuth not configured');
    }

    // Generate PKCE state parameter for security
    this.oauthState = this.generateRandomString(32);
    localStorage.setItem('oauth_state', this.oauthState);

    // Build GitHub OAuth URL
    const params = new URLSearchParams({
      client_id: environment.oauth.github.clientId,
      redirect_uri: environment.oauth.redirectUri,
      scope: environment.oauth.github.scope,
      state: this.oauthState,
      response_type: 'code'
    });

    const githubOAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    
    // Redirect to GitHub
    window.location.href = githubOAuthUrl;
  }

  /**
   * Handle OAuth callback with authorization code
   * @param code Authorization code from OAuth provider
   * @param state State parameter for CSRF protection
   * @returns Promise resolving to token response
   * @throws Error if state is invalid or exchange fails
   */
  async handleOAuthCallback(code: string, state: string): Promise<OAuthTokenResponse> {
    // Verify state parameter to prevent CSRF attacks
    const storedState = localStorage.getItem('oauth_state');
    if (!storedState || storedState !== state) {
      throw new Error('Invalid OAuth state parameter');
    }

    // Clean up stored state
    localStorage.removeItem('oauth_state');

    // Exchange authorization code for access token via backend
    const tokenResponse = await this.http.post<OAuthTokenResponse>(
      `${environment.apiBaseUrl}/auth/github/callback`, 
      {
        code,
        redirect_uri: environment.oauth.redirectUri
      }
    ).toPromise();

    if (!tokenResponse) {
      throw new Error('Failed to exchange authorization code');
    }

    return tokenResponse;
  }

  /**
   * Refresh authentication token using refresh token
   * @param refreshToken Current refresh token
   * @returns Promise resolving to new token response
   */
  async refreshAuthToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  }> {
    const response = await this.http.post<{
      access_token: string;
      expires_in: number;
      refresh_token?: string;
    }>(`${environment.apiBaseUrl}/auth/refresh`, {
      refresh_token: refreshToken
    }).toPromise();

    if (!response) {
      throw new Error('Failed to refresh token');
    }

    return response;
  }

  /**
   * Logout user on backend
   * @param token Current access token
   */
  async logoutOnBackend(token: string): Promise<void> {
    await this.http.post(`${environment.apiBaseUrl}/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).toPromise();
  }

  /**
   * Check if OAuth is properly configured
   */
  isOAuthConfigured(): boolean {
    return !!(environment.oauth?.github?.clientId && 
              environment.oauth.github.clientId !== 'your-github-client-id');
  }

  /**
   * Generate cryptographically secure random string
   */
  private generateRandomString(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}