import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../shared/models';
import { IAuthService } from '../interfaces/auth.interfaces';
import { AuthStateService } from './auth-state.service';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { OAuthService } from './oauth.service';
import { ConfigService } from '../../shared/services/config.service';

/**
 * Main authentication service that orchestrates focused auth services.
 * Follows SOLID principles:
 * - Single Responsibility: Orchestrates auth flow, delegates specific tasks to focused services
 * - Open/Closed: New auth methods can be added without modifying existing code
 * - Liskov Substitution: Can be replaced with alternative implementations
 * - Interface Segregation: Provides focused public interface
 * - Dependency Inversion: Depends on abstractions (services) not concrete implementations
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService implements IAuthService {

  constructor(
    private authState: AuthStateService,
    private tokenService: TokenService,
    private sessionService: SessionService,
    private oauthService: OAuthService,
    private config: ConfigService
  ) {
    this.initializeAuthState();
  }

  // Public API - Authentication State
  get isAuthenticated$(): Observable<boolean> {
    return this.authState.isAuthenticated$;
  }

  get currentUser$(): Observable<User | null> {
    return this.authState.currentUser$;
  }

  get isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  get currentUser(): User | null {
    return this.authState.currentUser;
  }

  // Public API - Authentication Actions

  /**
   * Initiate GitHub OAuth login
   */
  loginWithGitHub(): void {
    if (this.config.oauth.github.isConfigured) {
      this.oauthService.initiateGitHubOAuth();
    } else {
      throw new Error('GitHub OAuth is not configured');
    }
  }

  /**
   * Handle OAuth callback
   * @param code Authorization code
   * @param state State parameter
   */
  async handleOAuthCallback(code: string, state: string): Promise<void> {
    try {
      const tokenResponse = await this.oauthService.handleOAuthCallback(code, state);

      // Store authentication data
      this.tokenService.storeAuthData(
        tokenResponse.access_token,
        tokenResponse.user,
        tokenResponse.expires_in,
        tokenResponse.refresh_token
      );

      // Update auth state
      this.authState.setAuthenticationState(true, tokenResponse.user);

      // Start session monitoring
      this.startSessionManagement();
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
  }

  /**
   * Logout user and clean up
   */
  async logout(): Promise<void> {
    const token = this.tokenService.getToken();

    // Stop session monitoring
    this.sessionService.stopSessionMonitoring();

    // Logout on backend if token exists
    if (token) {
      try {
        await this.oauthService.logoutOnBackend(token);
      } catch (error) {
        console.warn('Backend logout failed:', error);
      }
    }

    // Clear all stored data
    this.tokenService.clearAllStoredData();

    // Clear auth state
    this.authState.clearAuthenticationState();
  }

  /**
   * Get current JWT token
   */
  getToken(): string | null {
    return this.tokenService.getToken();
  }

  /**
   * Manually refresh token (used by interceptors)
   */
  async refreshToken(): Promise<string | null> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await this.oauthService.refreshAuthToken(refreshToken);

      // Update stored token
      this.tokenService.updateToken(
        response.access_token,
        response.expires_in,
        response.refresh_token
      );

      return response.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  // Private methods

  /**
   * Initialize authentication state on service creation
   */
  private initializeAuthState(): void {
    const validation = this.tokenService.validateStoredToken();

    if (validation.isValid && validation.user) {
      // Restore auth state
      this.authState.setAuthenticationState(true, validation.user);
      this.startSessionManagement();

      // Refresh token if needed
      if (validation.needsRefresh) {
        this.refreshToken();
      }
    } else {
      // No valid auth state
      this.authState.clearAuthenticationState();
    }
  }

  /**
   * Start session management
   */
  private startSessionManagement(): void {
    this.sessionService.startSessionMonitoring(() => {
      // Session timeout callback
      this.logout().then(() => {
        console.log('Session expired due to inactivity');
      });
    });
  }
}