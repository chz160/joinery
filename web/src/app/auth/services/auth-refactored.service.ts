import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../shared/models';
import { AuthStateService } from './auth-state.service';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { OAuthService } from './oauth.service';
import { DemoService } from './demo.service';

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
export class AuthService {

  constructor(
    private authState: AuthStateService,
    private tokenService: TokenService,
    private sessionService: SessionService,
    private oauthService: OAuthService,
    private demoService: DemoService
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
    try {
      this.oauthService.initiateGitHubOAuth();
    } catch (error) {
      // If OAuth not configured, fall back to demo login
      console.warn('GitHub OAuth not configured, using demo login:', error);
      this.performDemoLogin().subscribe();
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
      
      // If backend is not available, fall back to demo auth
      if (this.isNetworkError(error)) {
        console.warn('Backend not available, using demo authentication');
        this.performDemoLogin().subscribe();
      } else {
        throw error;
      }
    }
  }

  /**
   * Perform demo login (for development)
   * @param rememberMe Whether to use persistent storage
   */
  performDemoLogin(rememberMe: boolean = false): Observable<User> {
    return this.demoService.performMockLogin(rememberMe);
  }

  /**
   * Toggle authentication state for demo purposes
   */
  toggleAuthForDemo(): void {
    if (this.isAuthenticated) {
      this.logout();
    } else {
      this.performDemoLogin(false).subscribe(user => {
        this.authState.setAuthenticationState(true, user);
      });
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
    if (token && !this.demoService.isDemoAuthentication()) {
      try {
        await this.oauthService.logoutOnBackend(token);
      } catch (error) {
        console.warn('Backend logout failed:', error);
      }
    }

    // Clear all stored data
    this.tokenService.clearAllStoredData();
    this.demoService.clearDemoAuth();
    
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
    if (!refreshToken || this.demoService.isDemoAuthentication()) {
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
    } else if (this.demoService.isDemoAuthentication()) {
      // Restore demo auth state
      const mockUser = this.demoService.getMockUser();
      this.authState.setAuthenticationState(true, mockUser);
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

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: any): boolean {
    return error instanceof Error && (
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network Error') ||
      error.message.includes('ERR_NETWORK')
    );
  }
}