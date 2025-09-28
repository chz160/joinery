import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../../shared/models';

/**
 * Service responsible for managing authentication state.
 * Follows Single Responsibility Principle - only handles auth state management.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);

  /**
   * Observable of authentication state
   */
  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  /**
   * Observable of current user
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
   * Set authentication state
   * @param isAuthenticated Whether user is authenticated
   * @param user Current user (null if not authenticated)
   */
  setAuthenticationState(isAuthenticated: boolean, user: User | null = null): void {
    this.isAuthenticatedSubject.next(isAuthenticated);
    this.currentUserSubject.next(user);
  }

  /**
   * Clear authentication state
   */
  clearAuthenticationState(): void {
    this.setAuthenticationState(false, null);
  }
}