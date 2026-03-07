import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedMaterialModule } from '../../../../shared/modules/material.module';
import { WizardStep } from '../../../../shared/models';

/**
 * StepIndicator - Visual progress indicator for the organization setup wizard.
 * Shows current progress, completed steps, and allows navigation to accessible steps.
 */
@Component({
  selector: 'app-step-indicator',
  imports: [
    CommonModule,
    SharedMaterialModule
  ],
  templateUrl: './step-indicator.html',
  styleUrl: './step-indicator.scss'
})
export class StepIndicatorComponent {
  @Input() steps: WizardStep[] = [];
  @Input() currentStep: number = 1;
  @Output() stepClicked = new EventEmitter<number>();

  /**
   * Handle step click navigation
   */
  onStepClick(step: WizardStep): void {
    if (this.canNavigateToStep(step)) {
      this.stepClicked.emit(step.id);
    }
  }

  /**
   * Check if user can navigate to a specific step
   */
  canNavigateToStep(step: WizardStep): boolean {
    // Can navigate to current step or any completed step
    return step.id <= this.currentStep || step.completed;
  }

  /**
   * Get the step status for styling
   */
  getStepStatus(step: WizardStep): 'completed' | 'current' | 'pending' | 'disabled' {
    if (step.completed) {
      return 'completed';
    }
    if (step.id === this.currentStep) {
      return 'current';
    }
    if (step.id < this.currentStep) {
      return 'pending';
    }
    return 'disabled';
  }

  /**
   * Get the appropriate icon for the step
   */
  getStepIcon(step: WizardStep): string {
    const status = this.getStepStatus(step);
    
    switch (step.id) {
      case 1:
        return status === 'completed' ? 'check' : 'business';
      case 2:
        return status === 'completed' ? 'check' : 'source';
      case 3:
        return status === 'completed' ? 'check' : 'group_add';
      case 4:
        return status === 'completed' ? 'check' : 'settings';
      case 5:
        return status === 'completed' ? 'check' : 'preview';
      default:
        return status === 'completed' ? 'check' : 'radio_button_unchecked';
    }
  }
}