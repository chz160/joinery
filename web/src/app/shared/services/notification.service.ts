import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface NotificationMessage {
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  duration?: number; // milliseconds
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new BehaviorSubject<NotificationMessage | null>(null);

  get notification$() {
    return this.notificationSubject.asObservable();
  }

  showInfo(message: string, duration: number = 3000): void {
    this.show({ message, type: 'info', duration });
  }

  showWarning(message: string, duration: number = 5000): void {
    this.show({ message, type: 'warning', duration });
  }

  showError(message: string, duration: number = 5000): void {
    this.show({ message, type: 'error', duration });
  }

  showSuccess(message: string, duration: number = 3000): void {
    this.show({ message, type: 'success', duration });
  }

  private show(notification: NotificationMessage): void {
    this.notificationSubject.next(notification);
    
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.clear();
      }, notification.duration);
    }
  }

  clear(): void {
    this.notificationSubject.next(null);
  }
}