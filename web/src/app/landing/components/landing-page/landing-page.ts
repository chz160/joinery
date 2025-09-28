import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedMaterialModule } from '../../../shared/modules/material.module';
import { BaseAuthComponent } from '../../../shared/components/base-auth-component';
import { DashboardPreviewComponent } from '../../../shared/components/dashboard-preview/dashboard-preview';

@Component({
  selector: 'app-landing-page',
  imports: [
    CommonModule,
    RouterModule,
    SharedMaterialModule,
    DashboardPreviewComponent
  ],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss'
})
export class LandingPage extends BaseAuthComponent implements OnInit {
  currentStep = 1;
  
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

  // Method to initiate GitHub OAuth login
  loginWithGitHub(): void {
    this.auth.loginWithGitHub();
  }

  // Method to scroll to a specific section
  scrollToSection(sectionId: string): void {
    const element = document.querySelector(`.${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}