import { Injectable } from '@angular/core';
import { User } from '../../shared/models';

/**
 * Service responsible for JWT token management and storage.
 * Follows Single Responsibility Principle - only handles token operations.
 */
@Injectable({
  providedIn: 'root'
})
export class TokenService {

  /**
   * Store authentication data securely
   * @param accessToken JWT access token
   * @param user User information
   * @param expiresIn Token expiry time in seconds
   * @param refreshToken Optional refresh token
   * @param persistent Whether to use persistent storage (localStorage vs sessionStorage)
   */
  storeAuthData(
    accessToken: string, 
    user: User, 
    expiresIn: number, 
    refreshToken?: string, 
    persistent: boolean = false
  ): void {
    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);

    const storage = persistent ? localStorage : sessionStorage;

    // Store in selected storage
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
   * Get stored JWT token
   * @returns JWT token or null if not found
   */
  getToken(): string | null {
    const storage = this.getStorage();
    return storage.getItem('jwt_token');
  }

  /**
   * Get stored refresh token
   * @returns Refresh token or null if not found
   */
  getRefreshToken(): string | null {
    const storage = this.getStorage();
    return storage.getItem('refresh_token');
  }

  /**
   * Get stored user data
   * @returns User object or null if not found/invalid
   */
  getStoredUser(): User | null {
    const storage = this.getStorage();
    const userJson = storage.getItem('current_user');
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (e) {
        console.error('Error parsing stored user data:', e);
      }
    }
    return null;
  }

  /**
   * Check if stored token is valid (not expired)
   * @returns Object with validation results
   */
  validateStoredToken(): { isValid: boolean; user: User | null; needsRefresh: boolean } {
    const storage = this.getStorage();
    const token = storage.getItem('jwt_token');
    const tokenExpiry = storage.getItem('jwt_token_expiry');
    
    if (!token || !tokenExpiry) {
      return { isValid: false, user: null, needsRefresh: false };
    }

    const expiryDate = new Date(tokenExpiry);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (expiryDate <= now) {
      // Token expired, clean up
      this.clearAllStoredData();
      return { isValid: false, user: null, needsRefresh: false };
    }

    const user = this.getStoredUser();
    const needsRefresh = expiryDate <= fiveMinutesFromNow;
    
    return { isValid: true, user, needsRefresh };
  }

  /**
   * Update stored token after refresh
   * @param newToken New access token
   * @param expiresIn Token expiry time in seconds
   * @param newRefreshToken Optional new refresh token
   */
  updateToken(newToken: string, expiresIn: number, newRefreshToken?: string): void {
    const storage = this.getStorage();
    const user = this.getStoredUser();
    const persistent = storage.getItem('auth_persistent') === 'true';
    
    if (user) {
      this.storeAuthData(newToken, user, expiresIn, newRefreshToken, persistent);
    }
  }

  /**
   * Clear all stored authentication data
   */
  clearAllStoredData(): void {
    this.clearStorageData(localStorage);
    this.clearStorageData(sessionStorage);
  }

  /**
   * Get the appropriate storage based on persistence setting
   */
  private getStorage(): Storage {
    // Check both storages to find where auth data is stored
    if (localStorage.getItem('jwt_token')) {
      return localStorage;
    } else if (sessionStorage.getItem('jwt_token')) {
      return sessionStorage;
    }
    
    // Default based on persistence setting
    const persistent = localStorage.getItem('auth_persistent') === 'true' || 
                      sessionStorage.getItem('auth_persistent') === 'true';
    return persistent ? localStorage : sessionStorage;
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
}