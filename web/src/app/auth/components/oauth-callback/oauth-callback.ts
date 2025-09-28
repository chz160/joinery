import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-oauth-callback',
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './oauth-callback.html',
  styleUrl: './oauth-callback.scss'
})
export class OAuthCallback implements OnInit {
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    this.handleOAuthCallback();
  }

  private async handleOAuthCallback(): Promise<void> {
    try {
      // Get authorization code and state from URL parameters
      const params = this.route.snapshot.queryParams;
      const code = params['code'];
      const state = params['state'];
      const error = params['error'];

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      // Exchange code for access token through auth service
      await this.auth.handleOAuthCallback(code, state);

      // Redirect to dashboard on successful authentication
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('OAuth callback error:', error);
      this.error = error instanceof Error ? error.message : 'Authentication failed';
      this.loading = false;
    }
  }

  retryAuthentication(): void {
    this.router.navigate(['/auth/login']);
  }

  cancelAuthentication(): void {
    this.router.navigate(['/']);
  }
}