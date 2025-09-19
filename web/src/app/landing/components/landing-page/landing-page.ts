import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Observable } from 'rxjs';
import { Auth } from '../../../auth/services/auth';
import { User } from '../../../shared/models';
import { DashboardPreviewComponent } from '../../../shared/components/dashboard-preview/dashboard-preview';

@Component({
  selector: 'app-landing-page',
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    DashboardPreviewComponent
  ],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss'
})
export class LandingPage implements OnInit {
  currentStep = 1;
  isAuthenticated$: Observable<boolean>;
  currentUser$: Observable<User | null>;
  
  constructor(private auth: Auth) {
    this.isAuthenticated$ = this.auth.isAuthenticated$;
    this.currentUser$ = this.auth.currentUser$;
  }

  ngOnInit(): void {
  }
  
  setStep(step: number) {
    this.currentStep = step;
  }
  
  getScreenTitle(): string {
    switch (this.currentStep) {
      case 1: return 'Joinery Query Editor';
      case 2: return 'Team Collaboration Hub';
      case 3: return 'Analytics & History Dashboard';
      default: return 'Joinery Workspace';
    }
  }

  // Demo method to toggle authentication state
  toggleAuthDemo(): void {
    this.auth.toggleAuthForDemo();
  }
}