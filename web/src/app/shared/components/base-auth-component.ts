import { inject, OnDestroy, Directive } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth-refactored.service';
import { User } from '../models';

/**
 * Base component class that provides common authentication-related observables and cleanup.
 * Eliminates duplication of auth observable setup across components.
 * 
 * Usage:
 * - Extend this class in components that need authentication state
 * - Access isAuthenticated$ and currentUser$ directly
 * - Automatic cleanup on component destruction
 */
@Directive()
export abstract class BaseAuthComponent implements OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly destroy$ = new Subject<void>();

  /**
   * Observable of authentication state
   */
  protected readonly isAuthenticated$: Observable<boolean>;

  /**
   * Observable of current user
   */
  protected readonly currentUser$: Observable<User | null>;

  constructor() {
    this.isAuthenticated$ = this.auth.isAuthenticated$.pipe(
      takeUntil(this.destroy$)
    );
    
    this.currentUser$ = this.auth.currentUser$.pipe(
      takeUntil(this.destroy$)
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}