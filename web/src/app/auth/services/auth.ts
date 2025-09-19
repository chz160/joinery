import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  // Mock user for demo purposes - in real app this would come from backend
  private mockUser: User = {
    id: '1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    avatar: 'https://github.com/johndoe.png',
    createdAt: new Date('2024-01-15')
  };

  constructor() {
    // For demo purposes, randomly set authentication state
    // In real app, this would check localStorage/sessionStorage or make API call
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
   * Mock authentication check - in real app would validate JWT token
   */
  private checkAuthenticationStatus(): void {
    // For demo purposes, use localStorage to persist auth state across page reloads
    const isAuth = localStorage.getItem('demo_auth') === 'true';
    
    if (isAuth) {
      this.isAuthenticatedSubject.next(true);
      this.currentUserSubject.next(this.mockUser);
    } else {
      this.isAuthenticatedSubject.next(false);
      this.currentUserSubject.next(null);
    }
  }

  /**
   * Mock login - in real app would redirect to OAuth provider
   */
  login(): Observable<User> {
    localStorage.setItem('demo_auth', 'true');
    this.isAuthenticatedSubject.next(true);
    this.currentUserSubject.next(this.mockUser);
    return of(this.mockUser);
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('demo_auth');
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
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
