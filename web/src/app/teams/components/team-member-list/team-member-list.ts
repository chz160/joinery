import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { SharedMaterialModule } from '../../../shared/modules/material.module';
import { TeamService } from '../../../shared/services/team.service';
import { Team, TeamMember, TeamMemberRole } from '../../../shared/models';
import { InviteMemberDialog, InviteMemberResult } from './invite-member-dialog/invite-member-dialog';
import { MemberRoleDialog, MemberRoleDialogResult } from './member-role-dialog/member-role-dialog';

@Component({
  selector: 'app-team-member-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedMaterialModule],
  templateUrl: './team-member-list.html',
  styleUrl: './team-member-list.scss'
})
export class TeamMemberList implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teamService = inject(TeamService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  team: Team | null = null;
  members: TeamMember[] = [];
  filteredMembers: TeamMember[] = [];

  searchQuery = '';
  roleFilter: TeamMemberRole | 'all' = 'all';

  isLoading = false;
  errorMessage: string | null = null;

  private teamId: string | null = null;

  readonly roleFilterOptions: { value: TeamMemberRole | 'all'; label: string }[] = [
    { value: 'all', label: 'All Roles' },
    { value: 'owner', label: 'Owner' },
    { value: 'admin', label: 'Admin' },
    { value: 'member', label: 'Member' },
    { value: 'viewer', label: 'Viewer' }
  ];

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.router.navigate(['/teams']);
        return;
      }
      this.teamId = id;
      this.loadTeamAndMembers(id);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters(): void {
    let result = this.members;

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query)
      );
    }

    if (this.roleFilter !== 'all') {
      result = result.filter(m => m.role === this.roleFilter);
    }

    this.filteredMembers = result;
  }

  getRoleBadgeClass(role: TeamMemberRole): string {
    return `role-badge role-${role}`;
  }

  openInviteDialog(): void {
    if (!this.team) return;

    const dialogRef = this.dialog.open(InviteMemberDialog, {
      width: '560px',
      data: { teamId: this.team.id, teamName: this.team.name }
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe((result: InviteMemberResult | undefined) => {
      if (result && this.teamId) {
        this.processInvites(result);
      }
    });
  }

  openRoleDialog(member: TeamMember): void {
    if (!this.team || member.role === 'owner') return;

    const dialogRef = this.dialog.open(MemberRoleDialog, {
      width: '400px',
      data: { member, teamName: this.team.name }
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe((result: MemberRoleDialogResult | undefined) => {
      if (result && this.teamId) {
        this.updateMemberRole(member, result.role);
      }
    });
  }

  removeMember(member: TeamMember): void {
    if (!this.teamId || member.role === 'owner') return;

    this.teamService.removeTeamMember(this.teamId, member.userId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.members = this.members.filter(m => m.userId !== member.userId);
        this.applyFilters();
      },
      error: () => {
        this.errorMessage = `Failed to remove ${member.name} from the team.`;
      }
    });
  }

  navigateBack(): void {
    this.router.navigate(['/teams']);
  }

  trackByMemberId(_: number, member: TeamMember): string {
    return member.userId;
  }

  trackByRoleFilterOption(_: number, option: { value: string }): string {
    return option.value;
  }

  private loadTeamAndMembers(teamId: string): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.teamService.getTeam(teamId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: team => { this.team = team; },
      error: () => {
        this.errorMessage = 'Failed to load team information.';
        this.isLoading = false;
      }
    });

    this.teamService.getTeamMembers(teamId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: members => {
        this.members = members;
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load team members.';
        this.isLoading = false;
      }
    });
  }

  private processInvites(result: InviteMemberResult): void {
    if (!this.teamId) return;

    const roleNum = TeamService.mapRoleToApi(result.role);
    const invites$ = result.emails.map(email =>
      this.teamService.inviteTeamMember(this.teamId!, { email, role: roleNum }).pipe(
        catchError(() => of({ error: true, email }))
      )
    );

    forkJoin(invites$).pipe(
      takeUntil(this.destroy$)
    ).subscribe(results => {
      const failed = results.filter(r => r && typeof r === 'object' && 'error' in r);
      if (failed.length > 0) {
        const failedEmails = failed.map(f => (f as { email: string }).email).join(', ');
        this.errorMessage = `Failed to invite: ${failedEmails}. Please try again.`;
      }
      if (this.teamId) {
        this.loadTeamAndMembers(this.teamId);
      }
    });
  }

  private updateMemberRole(member: TeamMember, newRole: TeamMemberRole): void {
    if (!this.teamId) return;

    const roleNum = TeamService.mapRoleToApi(newRole);
    this.teamService.updateMemberRole(this.teamId, member.userId, { role: roleNum }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        member.role = newRole;
        this.applyFilters();
      },
      error: () => {
        this.errorMessage = `Failed to update role for ${member.name}.`;
      }
    });
  }
}
