import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { User } from '../../shared/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private oauthState: string | null = null;

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
    // Check for JWT token in localStorage
    const token = localStorage.getItem('jwt_token');
    const tokenExpiry = localStorage.getItem('jwt_token_expiry');
    
    if (token && tokenExpiry) {
      const expiryDate = new Date(tokenExpiry);
      
      if (expiryDate > new Date()) {
        // Token is valid, restore user state
        const userJson = localStorage.getItem('current_user');
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
  login(): Observable<User> {
    // For demo purposes - this would not exist in production
    localStorage.setItem('demo_auth', 'true');
    this.isAuthenticatedSubject.next(true);
    this.currentUserSubject.next(this.mockUser);
    return of(this.mockUser);
  }

  /**
   * Logout user and clean up authentication data
   */
  logout(): void {
    this.clearStoredAuthData();
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }

  /**
   * Store authentication data securely
   */
  private storeAuthData(accessToken: string, user: User, expiresIn: number, refreshToken?: string): void {
    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);

    // Store in localStorage (in production, consider using httpOnly cookies)
    localStorage.setItem('jwt_token', accessToken);
    localStorage.setItem('jwt_token_expiry', expiryDate.toISOString());
    localStorage.setItem('current_user', JSON.stringify(user));
    
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }

    // Remove old demo auth if present
    localStorage.removeItem('demo_auth');
  }

  /**
   * Clear all stored authentication data
   */
  private clearStoredAuthData(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('jwt_token_expiry');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('demo_auth');
    localStorage.removeItem('oauth_state');
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
    return localStorage.getItem('jwt_token');
  }

  /**
   * Toggle authentication state for demo purposes
   */
  toggleAuthForDemo(): void {
    if (this.isAuthenticated) {
      this.logout();
    } else {
      this.login().subscribe();
    }
  }
}
