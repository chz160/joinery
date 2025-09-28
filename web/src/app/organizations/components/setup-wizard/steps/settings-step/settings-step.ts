import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { SharedMaterialModule } from '../../../../../shared/modules/material.module';
import { OrganizationSettings } from '../../../../../shared/models';

/**
 * Settings Step - Fourth step of the setup wizard.
 * Configures initial organization policies and settings.
 */
@Component({
  selector: 'app-settings-step',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedMaterialModule
  ],
  templateUrl: './settings-step.html',
  styleUrl: './settings-step.scss'
})
export class SettingsStepComponent implements OnInit {
  @Input() data: OrganizationSettings | null = null;
  @Output() dataChanged = new EventEmitter<OrganizationSettings>();

  settingsForm!: FormGroup;

  visibilityOptions = [
    { value: 'private', label: 'Private', description: 'Only visible to query creator' },
    { value: 'team', label: 'Team', description: 'Visible to team members' },
    { value: 'organization', label: 'Organization', description: 'Visible to all organization members' }
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormSubscriptions();
  }

  private initializeForm(): void {
    this.settingsForm = this.fb.group({
      defaultQueryVisibility: [this.data?.defaultQueryVisibility || 'team'],
      allowRepositoryIntegration: [this.data?.allowRepositoryIntegration ?? true],
      requireApprovalForQueries: [this.data?.requireApprovalForQueries ?? false],
      enableAuditLogging: [this.data?.enableAuditLogging ?? true]
    });
  }

  private setupFormSubscriptions(): void {
    this.settingsForm.valueChanges.subscribe(value => {
      this.dataChanged.emit(value);
    });
  }

  getVisibilityDescription(value: string): string {
    return this.visibilityOptions.find(option => option.value === value)?.description || '';
  }
}