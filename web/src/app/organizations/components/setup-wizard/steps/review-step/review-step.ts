import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedMaterialModule } from '../../../../../shared/modules/material.module';
import { OrganizationSetupWizardData } from '../../../../../shared/models';

/**
 * Review Step - Final step of the setup wizard.
 * Shows a summary of all configuration choices before creating the organization.
 */
@Component({
  selector: 'app-review-step',
  imports: [
    CommonModule,
    SharedMaterialModule
  ],
  templateUrl: './review-step.html',
  styleUrl: './review-step.scss'
})
export class ReviewStepComponent {
  @Input() data: OrganizationSetupWizardData | null = null;

  getAuthProviderName(type: string): string {
    const providers: { [key: string]: string } = {
      'github': 'GitHub',
      'microsoft': 'Microsoft',
      'aws-iam': 'AWS IAM'
    };
    return providers[type] || type;
  }

  getVisibilityLabel(value: string): string {
    const labels: { [key: string]: string } = {
      'private': 'Private',
      'team': 'Team',
      'organization': 'Organization'
    };
    return labels[value] || value;
  }
}