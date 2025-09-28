import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SharedMaterialModule } from '../../../../../shared/modules/material.module';
import { TeamInvitation } from '../../../../../shared/models';

/**
 * Team Invitation Step - Third step of the setup wizard.
 * Allows users to invite team members to join their organization.
 */
@Component({
  selector: 'app-team-invitation-step',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedMaterialModule
  ],
  templateUrl: './team-invitation-step.html',
  styleUrl: './team-invitation-step.scss'
})
export class TeamInvitationStepComponent {
  @Input() data: TeamInvitation[] = [];
  @Output() dataChanged = new EventEmitter<TeamInvitation[]>();

  invitationForm: FormGroup;

  roles = [
    { value: 'admin', label: 'Admin', description: 'Can manage organization settings and members' },
    { value: 'member', label: 'Member', description: 'Can create and edit queries within teams' },
    { value: 'viewer', label: 'Viewer', description: 'Can view shared queries and results' }
  ];

  constructor(private fb: FormBuilder) {
    this.invitationForm = this.fb.group({
      invitations: this.fb.array([])
    });

    // Initialize with existing data or add first invitation
    if (this.data.length > 0) {
      this.data.forEach(invitation => this.addInvitation(invitation));
    } else {
      this.addInvitation();
    }

    // Subscribe to form changes
    this.invitationForm.valueChanges.subscribe(() => {
      this.emitDataChange();
    });
  }

  get invitations(): FormArray {
    return this.invitationForm.get('invitations') as FormArray;
  }

  addInvitation(invitation?: TeamInvitation): void {
    const invitationGroup = this.fb.group({
      email: [invitation?.email || '', [Validators.required, Validators.email]],
      name: [invitation?.name || ''],
      role: [invitation?.role || 'member', Validators.required]
    });

    this.invitations.push(invitationGroup);
  }

  removeInvitation(index: number): void {
    this.invitations.removeAt(index);
    this.emitDataChange();
  }

  private emitDataChange(): void {
    const invitations = this.invitations.value.filter((inv: any) => inv.email.trim());
    this.dataChanged.emit(invitations);
  }

  getRoleDescription(role: string): string {
    return this.roles.find(r => r.value === role)?.description || '';
  }
}