import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User } from '../../shared/models';

/**
 * Service responsible for demo/mock authentication functionality.
 * Follows KISS principle - simple, separate from production authentication logic.
 * This service would be removed or disabled in production builds.
 */
@Injectable({
  providedIn: 'root'
})
export class DemoService {
  
  // Mock user for demo purposes
  private readonly mockUser: User = {
    id: '1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    avatar: 'https://github.com/johndoe.png',
    createdAt: new Date('2024-01-15')
  };

  /**
   * Perform mock login for demo purposes
   * @param rememberMe Whether to use persistent storage
   * @returns Observable of mock user
   */
  performMockLogin(rememberMe: boolean = false): Observable<User> {
    // Store demo auth flag
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('demo_auth', 'true');
    storage.setItem('auth_persistent', rememberMe.toString());
    
    // Clear other storage
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem('demo_auth');
    otherStorage.removeItem('auth_persistent');
    
    return of(this.mockUser);
  }

  /**
   * Check if current authentication is from demo/mock
   * @returns True if current auth state is from demo
   */
  isDemoAuthentication(): boolean {
    return localStorage.getItem('demo_auth') === 'true' || 
           sessionStorage.getItem('demo_auth') === 'true';
  }

  /**
   * Clear demo authentication data
   */
  clearDemoAuth(): void {
    localStorage.removeItem('demo_auth');
    sessionStorage.removeItem('demo_auth');
  }

  /**
   * Get mock user data
   */
  getMockUser(): User {
    return { ...this.mockUser }; // Return copy to prevent mutation
  }
}