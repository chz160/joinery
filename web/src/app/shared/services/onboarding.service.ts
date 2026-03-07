import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { Auth } from '../../auth/services/auth';
import { OrganizationService } from './organization.service';

/**
 * Service to handle first-time user onboarding flow.
 * Detects when a user should be directed to the organization setup wizard.
 */
@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  constructor(
    private auth: Auth,
    private organizationService: OrganizationService,
    private router: Router
  ) {}

  /**
   * Check if user needs to go through organization setup
   * @returns Observable<boolean> - true if user should be redirected to setup
   */
  shouldRedirectToSetup(): Observable<boolean> {
    return this.auth.isAuthenticated$.pipe(
      switchMap(isAuthenticated => {
        if (!isAuthenticated) {
          return of(false);
        }
        
        // Check if user has any organizations
        return this.organizationService.isFirstTimeUser().pipe(
          catchError(() => of(false)) // If API call fails, don't redirect
        );
      })
    );
  }

  /**
   * Check and redirect first-time users to setup wizard
   * Call this method after successful authentication
   */
  checkAndRedirectFirstTimeUser(): void {
    this.shouldRedirectToSetup().subscribe(shouldRedirect => {
      if (shouldRedirect) {
        // Store the intended redirect URL for after setup completion
        const currentUrl = this.router.url;
        if (currentUrl && currentUrl !== '/organizations/setup' && currentUrl !== '/') {
          localStorage.setItem('postSetupRedirectUrl', currentUrl);
        }
        
        this.router.navigate(['/organizations/setup']);
      }
    });
  }

  /**
   * Get the URL to redirect to after setup completion
   */
  getPostSetupRedirectUrl(): string {
    const storedUrl = localStorage.getItem('postSetupRedirectUrl');
    localStorage.removeItem('postSetupRedirectUrl'); // Clean up
    return storedUrl || '/dashboard';
  }

  /**
   * Mark user as no longer first-time (for testing purposes)
   */
  markUserAsSetup(): void {
    // In a real implementation, this would be handled by the backend
    // For now, we can store a flag in localStorage for development
    localStorage.setItem('userHasCompletedSetup', 'true');
  }

  /**
   * Check if user has completed setup (for testing)
   */
  hasUserCompletedSetup(): boolean {
    return localStorage.getItem('userHasCompletedSetup') === 'true';
  }

  /**
   * Reset setup state (for testing)
   */
  resetSetupState(): void {
    localStorage.removeItem('userHasCompletedSetup');
    localStorage.removeItem('postSetupRedirectUrl');
  }
}