import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SharedMaterialModule } from '../../../../../shared/modules/material.module';
import { OrganizationService } from '../../../../../shared/services/organization.service';
import { Organization, AuthProvider } from '../../../../../shared/models';

/**
 * Organization Details Step - First step of the setup wizard.
 * Collects basic organization information including name, description, and authentication provider.
 */
@Component({
  selector: 'app-organization-details-step',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedMaterialModule
  ],
  templateUrl: './organization-details-step.html',
  styleUrl: './organization-details-step.scss'
})
export class OrganizationDetailsStepComponent implements OnInit, OnDestroy {
  @Input() data: Partial<Organization> | null = null;
  @Output() dataChanged = new EventEmitter<Partial<Organization>>();

  private destroy$ = new Subject<void>();
  
  organizationForm!: FormGroup;
  isCheckingName = false;
  nameCheckResult: 'available' | 'taken' | 'error' | null = null;

  authProviders: { type: AuthProvider['type'], name: string, icon: string }[] = [
    { type: 'github', name: 'GitHub', icon: 'code' },
    { type: 'microsoft', name: 'Microsoft', icon: 'business' },
    { type: 'aws-iam', name: 'AWS IAM', icon: 'cloud' }
  ];

  constructor(
    private fb: FormBuilder,
    private organizationService: OrganizationService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.organizationForm = this.fb.group({
      name: [this.data?.name || '', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9\s\-_\.]+$/)
      ]],
      description: [this.data?.description || '', [
        Validators.maxLength(500)
      ]],
      authProviderType: [this.data?.authProvider?.type || 'github', Validators.required]
    });
  }

  private setupFormSubscriptions(): void {
    // Emit data changes
    this.organizationForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300)
      )
      .subscribe(value => {
        const organizationData: Partial<Organization> = {
          name: value.name?.trim(),
          description: value.description?.trim(),
          authProvider: {
            type: value.authProviderType,
            config: { clientId: '' }
          }
        };
        this.dataChanged.emit(organizationData);
      });

    // Check organization name uniqueness
    this.organizationForm.get('name')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(name => {
        if (name && name.trim().length >= 2) {
          this.checkOrganizationName(name.trim());
        } else {
          this.nameCheckResult = null;
        }
      });
  }

  private checkOrganizationName(name: string): void {
    this.isCheckingName = true;
    this.nameCheckResult = null;

    this.organizationService.checkOrganizationNameUniqueness(name)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (isUnique) => {
          this.isCheckingName = false;
          this.nameCheckResult = isUnique ? 'available' : 'taken';
        },
        error: (error) => {
          this.isCheckingName = false;
          this.nameCheckResult = 'error';
          console.error('Error checking organization name:', error);
        }
      });
  }

  /**
   * Get form control for template access
   */
  getFormControl(controlName: string) {
    return this.organizationForm.get(controlName);
  }

  /**
   * Get error message for organization name field
   */
  getNameErrorMessage(): string {
    const control = this.getFormControl('name');
    if (!control?.errors) return '';

    if (control.errors['required']) {
      return 'Organization name is required';
    }
    if (control.errors['minlength']) {
      return 'Organization name must be at least 2 characters';
    }
    if (control.errors['maxlength']) {
      return 'Organization name must be less than 50 characters';
    }
    if (control.errors['pattern']) {
      return 'Organization name can only contain letters, numbers, spaces, hyphens, underscores, and dots';
    }

    return 'Invalid organization name';
  }

  /**
   * Get error message for description field
   */
  getDescriptionErrorMessage(): string {
    const control = this.getFormControl('description');
    if (!control?.errors) return '';

    if (control.errors['maxlength']) {
      return 'Description must be less than 500 characters';
    }

    return 'Invalid description';
  }

  /**
   * Get the current character count for description
   */
  getDescriptionCharCount(): number {
    return this.getFormControl('description')?.value?.length || 0;
  }

  /**
   * Get icon for auth provider
   */
  getAuthProviderIcon(type: string): string {
    return this.authProviders.find(provider => provider.type === type)?.icon || 'account_circle';
  }

  /**
   * Handle auth provider selection
   */
  onAuthProviderChange(type: AuthProvider['type']): void {
    this.organizationForm.patchValue({ authProviderType: type });
  }

  /**
   * Get selected auth provider name for display
   */
  getSelectedAuthProviderName(): string {
    const selectedType = this.getFormControl('authProviderType')?.value;
    return this.authProviders.find(provider => provider.type === selectedType)?.name || '';
  }
}