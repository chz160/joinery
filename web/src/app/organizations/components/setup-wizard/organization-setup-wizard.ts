import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SharedMaterialModule } from '../../../shared/modules/material.module';
import { OrganizationService } from '../../../shared/services/organization.service';
import { RepositoryService } from '../../../shared/services/repository.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { OrganizationSetupWizardData, WizardStep, GitHubRepository, TeamInvitation, OrganizationSettings } from '../../../shared/models';
import { StepIndicatorComponent } from './step-indicator/step-indicator';
import { OrganizationDetailsStepComponent } from './steps/organization-details-step/organization-details-step';
import { RepositoryConnectionStepComponent } from './steps/repository-connection-step/repository-connection-step';
import { TeamInvitationStepComponent } from './steps/team-invitation-step/team-invitation-step';
import { SettingsStepComponent } from './steps/settings-step/settings-step';
import { ReviewStepComponent } from './steps/review-step/review-step';

/**
 * Organization Setup Wizard - Multi-step onboarding flow for new organizations.
 * Guides users through organization creation, repository connection, team setup, and configuration.
 * 
 * Steps:
 * 1. Organization Details - Name, description, authentication provider
 * 2. Repository Connection - Connect GitHub/GitLab repositories  
 * 3. Team Member Invitation - Invite team members with roles
 * 4. Initial Settings - Configure default policies and settings
 * 5. Review & Confirmation - Review all selections and create organization
 */
@Component({
  selector: 'app-organization-setup-wizard',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedMaterialModule,
    StepIndicatorComponent,
    OrganizationDetailsStepComponent,
    RepositoryConnectionStepComponent,
    TeamInvitationStepComponent,
    SettingsStepComponent,
    ReviewStepComponent
  ],
  templateUrl: './organization-setup-wizard.html',
  styleUrl: './organization-setup-wizard.scss'
})
export class OrganizationSetupWizard implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentStep = 1;
  totalSteps = 5;
  wizardData: OrganizationSetupWizardData | null = null;
  isLoading = false;
  
  steps: WizardStep[] = [
    {
      id: 1,
      title: 'Organization Details',
      description: 'Basic information about your organization',
      completed: false,
      valid: false
    },
    {
      id: 2,
      title: 'Repository Connection',
      description: 'Connect your GitHub repositories (optional)',
      completed: false,
      valid: true // Optional step, so valid by default
    },
    {
      id: 3,
      title: 'Team Members',
      description: 'Invite team members to join (optional)',
      completed: false,
      valid: true // Optional step, so valid by default
    },
    {
      id: 4,
      title: 'Initial Settings',
      description: 'Configure organization policies',
      completed: false,
      valid: false
    },
    {
      id: 5,
      title: 'Review & Confirm',
      description: 'Review your configuration and create organization',
      completed: false,
      valid: false
    }
  ];

  constructor(
    private organizationService: OrganizationService,
    private repositoryService: RepositoryService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeWizard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeWizard(): void {
    // Initialize wizard data
    this.wizardData = this.organizationService.initializeWizardData();
    
    // Subscribe to wizard data changes
    this.organizationService.wizardData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.wizardData = data;
        this.updateStepValidation();
      });
  }

  /**
   * Navigate to the next step
   */
  nextStep(): void {
    if (this.currentStep < this.totalSteps && this.isCurrentStepValid()) {
      this.markStepCompleted(this.currentStep);
      this.currentStep++;
      this.updateWizardStep();
    }
  }

  /**
   * Navigate to the previous step
   */
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateWizardStep();
    }
  }

  /**
   * Jump to a specific step (only if previous steps are completed)
   */
  goToStep(stepNumber: number): void {
    if (stepNumber <= this.currentStep || this.canAccessStep(stepNumber)) {
      this.currentStep = stepNumber;
      this.updateWizardStep();
    }
  }

  /**
   * Skip the current step (only for optional steps)
   */
  skipStep(): void {
    if (this.isCurrentStepOptional()) {
      this.markStepCompleted(this.currentStep);
      this.nextStep();
    }
  }

  /**
   * Complete the wizard and create the organization
   */
  completeWizard(): void {
    if (!this.canCompleteWizard()) {
      return;
    }

    this.isLoading = true;
    
    this.organizationService.completeWizard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (organization) => {
          this.isLoading = false;
          this.markStepCompleted(this.totalSteps);
          
          this.notificationService.showSuccess(
            `Organization "${organization.name}" created successfully!`
          );
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error creating organization:', error);
          this.notificationService.showError(
            'Failed to create organization. Please try again.'
          );
        }
      });
  }

  /**
   * Cancel the wizard and return to previous page
   */
  cancelWizard(): void {
    if (confirm('Are you sure you want to cancel the organization setup? Your progress will be lost.')) {
      this.organizationService.clearWizardData();
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Handle step data updates from child components
   */
  onStepDataUpdate(stepData: any): void {
    if (!this.wizardData) return;

    switch (this.currentStep) {
      case 1:
        this.organizationService.updateWizardData({
          organization: { ...this.wizardData.organization, ...stepData }
        });
        break;
      case 2:
        this.organizationService.updateWizardData({
          repositories: stepData
        });
        break;
      case 3:
        this.organizationService.updateWizardData({
          teamMembers: stepData
        });
        break;
      case 4:
        this.organizationService.updateWizardData({
          settings: { ...this.wizardData.settings, ...stepData }
        });
        break;
    }
  }

  /**
   * Update wizard step in service
   */
  private updateWizardStep(): void {
    this.organizationService.updateWizardData({ currentStep: this.currentStep });
  }

  /**
   * Check if current step is valid
   */
  isCurrentStepValid(): boolean {
    return this.steps[this.currentStep - 1]?.valid || false;
  }

  /**
   * Check if current step is optional
   */
  isCurrentStepOptional(): boolean {
    return [2, 3].includes(this.currentStep); // Repository and team steps are optional
  }

  /**
   * Check if user can access a specific step
   */
  private canAccessStep(stepNumber: number): boolean {
    // User can access a step if all previous required steps are completed
    for (let i = 1; i < stepNumber; i++) {
      if (!this.steps[i - 1].completed && !this.isStepOptional(i)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if a step is optional
   */
  private isStepOptional(stepNumber: number): boolean {
    return [2, 3].includes(stepNumber);
  }

  /**
   * Mark a step as completed
   */
  private markStepCompleted(stepNumber: number): void {
    if (stepNumber <= this.steps.length) {
      this.steps[stepNumber - 1].completed = true;
    }
  }

  /**
   * Check if wizard can be completed
   */
  canCompleteWizard(): boolean {
    // All required steps must be valid
    return this.steps[0].valid && // Organization details
           this.steps[3].valid && // Settings
           this.currentStep === this.totalSteps; // Must be on review step
  }

  /**
   * Update step validation based on current data
   */
  private updateStepValidation(): void {
    if (!this.wizardData) return;

    // Step 1: Organization Details
    this.steps[0].valid = !!(
      this.wizardData.organization.name?.trim() &&
      this.wizardData.organization.authProvider?.type
    );

    // Step 2: Repository Connection (optional - always valid)
    this.steps[1].valid = true;

    // Step 3: Team Members (optional - always valid)
    this.steps[2].valid = true;

    // Step 4: Settings
    this.steps[3].valid = !!(
      this.wizardData.settings.defaultQueryVisibility
    );

    // Step 5: Review (valid if all required steps are valid)
    this.steps[4].valid = this.steps[0].valid && this.steps[3].valid;
  }

  /**
   * Get the current step data for display
   */
  getCurrentStepData(): any {
    if (!this.wizardData) return null;

    switch (this.currentStep) {
      case 1:
        return this.wizardData.organization;
      case 2:
        return this.wizardData.repositories;
      case 3:
        return this.wizardData.teamMembers;
      case 4:
        return this.wizardData.settings;
      case 5:
        return this.wizardData;
      default:
        return null;
    }
  }
}