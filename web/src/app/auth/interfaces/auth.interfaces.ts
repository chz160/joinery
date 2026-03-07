/**
 * Authentication interfaces for improved type safety and separation of concerns.
 * Following Interface Segregation Principle - clients only depend on interfaces they need.
 */

import { Observable } from 'rxjs';
import { User } from '../../shared/models';

/**
 * Core authentication state interface
 */
export interface IAuthState {
  isAuthenticated$: Observable<boolean>;
  currentUser$: Observable<User | null>;
  isAuthenticated: boolean;
  currentUser: User | null;
}

/**
 * Authentication actions interface
 */
export interface IAuthActions {
  loginWithGitHub(): void;
  logout(): Promise<void>;
  toggleAuthForDemo(): void;
}

/**
 * Token management interface
 */
export interface ITokenProvider {
  getToken(): string | null;
  refreshToken(): Promise<string | null>;
}

/**
 * OAuth callback interface
 */
export interface IOAuthHandler {
  handleOAuthCallback(code: string, state: string): Promise<void>;
}

/**
 * Demo authentication interface
 */
export interface IDemoAuth {
  performDemoLogin(rememberMe?: boolean): Observable<User>;
}

/**
 * Main authentication service interface combining all concerns
 */
export interface IAuthService extends 
  IAuthState, 
  IAuthActions, 
  ITokenProvider, 
  IOAuthHandler, 
  IDemoAuth {
}