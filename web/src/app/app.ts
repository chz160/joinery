import { Component, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedMaterialModule } from './shared/modules/material.module';
import { AuthService } from './auth/services/auth.service';
import { NotificationComponent } from './shared/components/notification/notification.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, 
    SharedMaterialModule,
    CommonModule,
    NotificationComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Joinery');

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  get isAuthenticated$() {
    return this.auth.isAuthenticated$;
  }

  get currentUser$() {
    return this.auth.currentUser$;
  }

  onLogout(): void {
    this.auth.logout().then(() => {
      this.router.navigate(['/']);
    });
  }
}
