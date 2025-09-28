import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, interval, fromEvent, merge, timer } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User } from '../../shared/models';
import { environment } from '../../../environments/environment';
import { throttleTime, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private oauthState: string | null = null;
  
  // Session management
  private readonly SESSION_IDLE_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds
  private readonly SESSION_WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
  private sessionTimeout: any = null;
  private sessionWarningShown = false;
  private refreshTokenTimeout: any = null;

  // Mock user for demo purposes - in real app this would come from backend
  private mockUser: User = {
    id: '1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    avatar: 'https://github.com/johndoe.png',
    createdAt: new Date('2024-01-15')
  };

  constructor(private http: HttpClient) {
    // Check for existing authentication state
    this.checkAuthenticationStatus();
    
    // Start session monitoring if authenticated
    if (this.isAuthenticated) {
      this.startSessionMonitoring();
    }
    
    // Listen for authentication state changes to manage session monitoring
    this.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.startSessionMonitoring();
      } else {
        this.stopSessionMonitoring();
      }
    });
  }

  /**
   * Check if user is currently authenticated
   */
  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  /**
   * Get current authenticated user
   */
  get currentUser$(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  /**
   * Get current authentication status synchronously
   */
  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Get current user synchronously
   */
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check authentication status - validates stored tokens
   */
  private checkAuthenticationStatus(): void {
    // Check for JWT token in both localStorage and sessionStorage
    const storage = this.getStorage();
    const token = storage.getItem('jwt_token');
    const tokenExpiry = storage.getItem('jwt_token_expiry');
    
    if (token && tokenExpiry) {
      const expiryDate = new Date(tokenExpiry);
      
      if (expiryDate > new Date()) {
        // Token is valid, restore user state
        const userJson = storage.getItem('current_user');
        if (userJson) {
          try {
            const user = JSON.parse(userJson);
            this.isAuthenticatedSubject.next(true);
            this.currentUserSubject.next(user);
            return;
          } catch (e) {
            console.error('Error parsing stored user data:', e);
          }
        }
      } else {
        // Token expired, clean up
        this.clearStoredAuthData();
      }
    }
    
    // If no valid token, user is not authenticated
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }

  /**
   * Initiate GitHub OAuth flow
   */
  loginWithGitHub(): void {
    // Generate PKCE state parameter for security
    this.oauthState = this.generateRandomString(32);
    localStorage.setItem('oauth_state', this.oauthState);

    // For now, as a fallback when backend is not available, use mock login
    if (!environment.oauth.github.clientId || environment.oauth.github.clientId === 'your-github-client-id') {
      console.warn('GitHub OAuth not configured, using mock login');
      this.login().subscribe();
      return;
    }

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
   */
  async handleOAuthCallback(code: string, state: string): Promise<void> {
    // Verify state parameter to prevent CSRF attacks
    const storedState = localStorage.getItem('oauth_state');
    if (!storedState || storedState !== state) {
      throw new Error('Invalid OAuth state parameter');
    }

    // Clean up stored state
    localStorage.removeItem('oauth_state');

    try {
      // Exchange authorization code for access token via backend
      const tokenResponse = await this.http.post<{
        access_token: string;
        refresh_token?: string;
        expires_in: number;
        user: User;
      }>(`${environment.apiBaseUrl}/auth/github/callback`, {
        code,
        redirect_uri: environment.oauth.redirectUri
      }).toPromise();

      if (!tokenResponse) {
        throw new Error('Failed to exchange authorization code');
      }

      // Store tokens and user data
      this.storeAuthData(tokenResponse.access_token, tokenResponse.user, tokenResponse.expires_in, tokenResponse.refresh_token);
      
      // Update authentication state
      this.isAuthenticatedSubject.next(true);
      this.currentUserSubject.next(tokenResponse.user);
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      
      // If backend is not available, fall back to mock authentication for development
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        console.warn('Backend not available, using mock authentication for development');
        this.login().subscribe();
        return;
      }
      
      throw error;
    }
  }

  /**
   * Mock login for development/demo purposes
   */
  login(rememberMe: boolean = false): Observable<User> {
    // For demo purposes - this would not exist in production
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('demo_auth', 'true');
    storage.setItem('auth_persistent', rememberMe.toString());
    
    // Clear other storage
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem('demo_auth');
    otherStorage.removeItem('auth_persistent');
    
    this.isAuthenticatedSubject.next(true);
    this.currentUserSubject.next(this.mockUser);
    return of(this.mockUser);
  }

  /**
   * Logout user and clean up authentication data
   */
  async logout(): Promise<void> {
    const token = this.getToken();
    
    // Stop session monitoring
    this.stopSessionMonitoring();
    
    // Notify backend to revoke token (if available and token exists)
    if (token) {
      try {
        await this.http.post(`${environment.apiBaseUrl}/auth/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).toPromise();
      } catch (error) {
        // Log error but don't prevent logout if backend call fails
        console.warn('Backend logout failed, continuing with local cleanup:', error);
      }
    }

    // Always clear local authentication data
    this.clearStoredAuthData();
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }

  /**
   * Store authentication data securely
   */
  private storeAuthData(accessToken: string, user: User, expiresIn: number, refreshToken?: string, persistent: boolean = false): void {
    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);

    const storage = persistent ? localStorage : sessionStorage;

    // Store in selected storage (localStorage for persistent, sessionStorage for temporary)
    storage.setItem('jwt_token', accessToken);
    storage.setItem('jwt_token_expiry', expiryDate.toISOString());
    storage.setItem('current_user', JSON.stringify(user));
    storage.setItem('auth_persistent', persistent.toString());
    
    if (refreshToken) {
      storage.setItem('refresh_token', refreshToken);
    }

    // Remove old demo auth if present
    localStorage.removeItem('demo_auth');
    sessionStorage.removeItem('demo_auth');

    // If switching storage types, clear the other storage
    const otherStorage = persistent ? sessionStorage : localStorage;
    this.clearStorageData(otherStorage);
  }

  /**
   * Clear stored authentication data from specific storage
   */
  private clearStorageData(storage: Storage): void {
    storage.removeItem('jwt_token');
    storage.removeItem('jwt_token_expiry');
    storage.removeItem('refresh_token');
    storage.removeItem('current_user');
    storage.removeItem('demo_auth');
    storage.removeItem('oauth_state');
    storage.removeItem('auth_persistent');
  }

  /**
   * Clear all stored authentication data
   */
  private clearStoredAuthData(): void {
    this.clearStorageData(localStorage);
    this.clearStorageData(sessionStorage);
  }

  /**
   * Get the appropriate storage based on persistence setting
   */
  private getStorage(): Storage {
    // Check both storages to find where auth data is stored
    const persistent = localStorage.getItem('auth_persistent') === 'true' || 
                      sessionStorage.getItem('auth_persistent') === 'true';
    
    if (localStorage.getItem('jwt_token')) {
      return localStorage;
    } else if (sessionStorage.getItem('jwt_token')) {
      return sessionStorage;
    }
    
    return persistent ? localStorage : sessionStorage;
  }

  /**
   * Generate cryptographically secure random string
   */
  private generateRandomString(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    const storage = this.getStorage();
    return storage.getItem('jwt_token');
  }

  /**
   * Toggle authentication state for demo purposes
   */
  toggleAuthForDemo(): void {
    if (this.isAuthenticated) {
      this.logout();
    } else {
      this.login(false).subscribe();
    }
  }

  /**
   * Start session monitoring for idle timeout and token refresh
   */
  private startSessionMonitoring(): void {
    this.stopSessionMonitoring(); // Clear any existing timers
    
    // Monitor user activity
    this.startIdleTimer();
    this.startTokenRefreshTimer();
    this.listenForUserActivity();
  }

  /**
   * Stop all session monitoring timers
   */
  private stopSessionMonitoring(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = null;
    }
    this.sessionWarningShown = false;
  }

  /**
   * Start idle timer for session timeout
   */
  private startIdleTimer(): void {
    this.sessionTimeout = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.SESSION_IDLE_TIME);
  }

  /**
   * Handle session timeout
   */
  private handleSessionTimeout(): void {
    console.warn('Session timed out due to inactivity');
    this.logout().then(() => {
      // Could show a notification here
      console.log('Session expired. Please log in again.');
    });
  }

  /**
   * Reset idle timer when user activity is detected
   */
  private resetIdleTimer(): void {
    this.sessionWarningShown = false;
    this.startIdleTimer();
  }

  /**
   * Listen for user activity to reset idle timer
   */
  private listenForUserActivity(): void {
    // Listen for common user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Use merge to combine all event observables and throttle to prevent excessive timer resets
    merge(...events.map(event => fromEvent(document, event)))
      .pipe(throttleTime(1000)) // Throttle to once per second
      .subscribe(() => {
        if (this.isAuthenticated) {
          this.resetIdleTimer();
        }
      });
  }

  /**
   * Start automatic token refresh timer
   */
  private startTokenRefreshTimer(): void {
    const storage = this.getStorage();
    const tokenExpiry = storage.getItem('jwt_token_expiry');
    if (!tokenExpiry) return;

    const expiryDate = new Date(tokenExpiry);
    const currentTime = new Date();
    const timeUntilExpiry = expiryDate.getTime() - currentTime.getTime();
    
    // Refresh token 5 minutes before expiry
    const refreshTime = timeUntilExpiry - (5 * 60 * 1000);
    
    if (refreshTime > 0) {
      this.refreshTokenTimeout = setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
    } else if (timeUntilExpiry <= 0) {
      // Token already expired
      this.logout();
    }
  }

  /**
   * Refresh authentication token (public method for interceptor)
   */
  async refreshTokenManually(): Promise<string | null> {
    const storage = this.getStorage();
    const refreshToken = storage.getItem('refresh_token');
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await this.http.post<{
        access_token: string;
        expires_in: number;
        refresh_token?: string;
      }>(`${environment.apiBaseUrl}/auth/refresh`, {
        refresh_token: refreshToken
      }).toPromise();

      if (response) {
        // Update stored tokens
        const currentUser = this.currentUser;
        const persistent = storage.getItem('auth_persistent') === 'true';
        if (currentUser) {
          this.storeAuthData(
            response.access_token, 
            currentUser, 
            response.expires_in, 
            response.refresh_token || refreshToken,
            persistent
          );
          
          // Restart token refresh timer
          this.startTokenRefreshTimer();
          return response.access_token;
        }
      }
      return null;
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      return null;
    }
  }

  /**
   * Refresh authentication token
   */
  private async refreshToken(): Promise<void> {
    const newToken = await this.refreshTokenManually();
    if (!newToken) {
      console.warn('Token refresh failed, logging out');
      this.logout();
    }
  }

  /**
   * Show session timeout warning
   */
  private showSessionWarning(): void {
    if (!this.sessionWarningShown) {
      this.sessionWarningShown = true;
      // This could trigger a dialog/notification component
      console.warn('Session will expire soon. Please refresh your activity.');
    }
  }
}
