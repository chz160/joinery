import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedMaterialModule } from '../../../shared/modules/material.module';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedMaterialModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: Auth
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      // TODO: Implement email/password authentication logic
      console.log('Login attempt:', this.loginForm.value);
      this.router.navigate(['/dashboard']);
    }
  }

  loginWithProvider(provider: string): void {
    if (provider === 'github') {
      this.loginWithGitHub();
    } else {
      // TODO: Implement other OAuth providers
      console.log(`Login with ${provider} - Coming soon`);
    }
  }

  loginWithGitHub(): void {
    this.isLoading = true;
    try {
      this.auth.loginWithGitHub();
    } catch (error) {
      console.error('GitHub login error:', error);
      this.isLoading = false;
    }
  }
}
