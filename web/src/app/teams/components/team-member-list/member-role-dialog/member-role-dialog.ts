import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SharedMaterialModule } from '../../../../shared/modules/material.module';
import { TeamMember, TeamMemberRole } from '../../../../shared/models';

export interface MemberRoleDialogData {
  member: TeamMember;
  teamName: string;
}

export interface MemberRoleDialogResult {
  role: TeamMemberRole;
}

@Component({
  selector: 'app-member-role-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedMaterialModule],
  templateUrl: './member-role-dialog.html',
  styleUrl: './member-role-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberRoleDialog {
  private readonly dialogRef = inject(MatDialogRef<MemberRoleDialog>);
  readonly data: MemberRoleDialogData = inject(MAT_DIALOG_DATA);

  selectedRole: TeamMemberRole;

  readonly roleOptions: { value: TeamMemberRole; label: string; description: string }[] = [
    { value: 'admin', label: 'Admin', description: 'Can manage members and settings' },
    { value: 'member', label: 'Member', description: 'Can create and run queries' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access' }
  ];

  constructor() {
    this.selectedRole = this.data.member.role;
  }

  trackByRoleOption(_: number, option: { value: TeamMemberRole }): string {
    return option.value;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.selectedRole === this.data.member.role) {
      this.dialogRef.close();
      return;
    }
    const result: MemberRoleDialogResult = { role: this.selectedRole };
    this.dialogRef.close(result);
  }
}
