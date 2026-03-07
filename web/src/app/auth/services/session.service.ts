import { Injectable } from '@angular/core';
import { fromEvent, merge, timer, Subscription } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { NotificationService } from '../../shared/services/notification.service';

/**
 * Service responsible for session management and timeout monitoring.
 * Follows Single Responsibility Principle - only handles session lifecycle.
 */
@Injectable({
  providedIn: 'root'
})
export class SessionService {
  
  private readonly SESSION_IDLE_TIME = 30 * 60 * 1000; // 30 minutes
  private readonly SESSION_WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
  
  private sessionTimeout: any = null;
  private sessionWarningShown = false;
  private activitySubscription?: Subscription;

  constructor(private notificationService: NotificationService) {}

  /**
   * Start session monitoring for idle timeout
   * @param onTimeout Callback when session times out
   */
  startSessionMonitoring(onTimeout: () => void): void {
    this.stopSessionMonitoring();
    this.startIdleTimer(onTimeout);
    this.listenForUserActivity();
  }

  /**
   * Stop all session monitoring
   */
  stopSessionMonitoring(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
    if (this.activitySubscription) {
      this.activitySubscription.unsubscribe();
      this.activitySubscription = undefined;
    }
    this.sessionWarningShown = false;
  }

  /**
   * Reset session timer (called when user activity detected)
   * @param onTimeout Callback when session times out
   */
  resetSessionTimer(onTimeout: () => void): void {
    this.sessionWarningShown = false;
    this.startIdleTimer(onTimeout);
  }

  /**
   * Start idle timer for session timeout
   */
  private startIdleTimer(onTimeout: () => void): void {
    // Clear any existing timeout
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    
    // Set warning timer (show warning 5 minutes before timeout)
    const warningTime = this.SESSION_IDLE_TIME - this.SESSION_WARNING_TIME;
    timer(warningTime).subscribe(() => {
      this.showSessionWarning();
    });
    
    // Set main timeout
    this.sessionTimeout = setTimeout(() => {
      this.handleSessionTimeout(onTimeout);
    }, this.SESSION_IDLE_TIME);
  }

  /**
   * Handle session timeout
   */
  private handleSessionTimeout(onTimeout: () => void): void {
    console.warn('Session timed out due to inactivity');
    this.notificationService.showWarning(
      'Your session has expired due to inactivity. Please log in again.', 
      10000
    );
    onTimeout();
  }

  /**
   * Listen for user activity to reset idle timer
   */
  private listenForUserActivity(): void {
    // Listen for common user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Use merge to combine all event observables and throttle to prevent excessive timer resets
    this.activitySubscription = merge(...events.map(event => fromEvent(document, event)))
      .pipe(throttleTime(1000)) // Throttle to once per second
      .subscribe(() => {
        if (this.sessionTimeout) { // Only reset if session is being monitored
          this.resetSessionTimer(() => {}); // Empty callback for activity reset
        }
      });
  }

  /**
   * Show session timeout warning
   */
  private showSessionWarning(): void {
    if (!this.sessionWarningShown) {
      this.sessionWarningShown = true;
      this.notificationService.showWarning(
        'Your session will expire in 5 minutes due to inactivity. Move your mouse or click to extend your session.',
        8000
      );
    }
  }
}