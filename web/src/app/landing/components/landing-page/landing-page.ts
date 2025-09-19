import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-landing-page',
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss'
})
export class LandingPage {
  currentStep = 1;
  
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
}