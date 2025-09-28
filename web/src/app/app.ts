import { Component, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { Auth } from './auth/services/auth';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, 
    MatToolbarModule, 
    MatSidenavModule, 
    MatButtonModule, 
    MatIconModule, 
    MatListModule,
    MatMenuModule,
    MatDividerModule,
    CommonModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Joinery');

  constructor(
    private auth: Auth,
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
