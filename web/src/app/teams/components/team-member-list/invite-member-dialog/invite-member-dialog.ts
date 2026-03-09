import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SharedMaterialModule } from '../../../../shared/modules/material.module';
import { TeamMemberRole } from '../../../../shared/models';

export interface InviteMemberDialogData {
  teamId: string;
  teamName: string;
}

export interface InviteMemberResult {
  emails: string[];
  role: TeamMemberRole;
}

@Component({
  selector: 'app-invite-member-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedMaterialModule],
  templateUrl: './invite-member-dialog.html',
  styleUrl: './invite-member-dialog.scss'
})
export class InviteMemberDialog {
  private readonly dialogRef = inject(MatDialogRef<InviteMemberDialog>);
  readonly data: InviteMemberDialogData = inject(MAT_DIALOG_DATA);

  emailInput = '';
  emails: string[] = [];
  selectedRole: TeamMemberRole = 'member';
  emailError: string | null = null;

  readonly roleOptions: { value: TeamMemberRole; label: string; description: string }[] = [
    { value: 'admin', label: 'Admin', description: 'Can manage members and settings' },
    { value: 'member', label: 'Member', description: 'Can create and run queries' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access' }
  ];

  addEmail(): void {
    const email = this.emailInput.trim();
    this.emailError = null;

    if (!email) return;

    if (!this.isValidEmail(email)) {
      this.emailError = 'Please enter a valid email address';
      return;
    }

    if (this.emails.includes(email)) {
      this.emailError = 'This email has already been added';
      return;
    }

    this.emails.push(email);
    this.emailInput = '';
  }

  removeEmail(email: string): void {
    this.emails = this.emails.filter(e => e !== email);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addEmail();
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  invite(): void {
    if (this.emails.length === 0) return;
    const result: InviteMemberResult = {
      emails: this.emails,
      role: this.selectedRole
    };
    this.dialogRef.close(result);
  }

  trackByEmail(_: number, email: string): string {
    return email;
  }

  trackByRoleOption(_: number, option: { value: TeamMemberRole }): string {
    return option.value;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
