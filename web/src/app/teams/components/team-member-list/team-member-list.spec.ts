import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { TeamMemberList } from './team-member-list';
import { TeamService } from '../../../shared/services/team.service';
import { Team, TeamMember } from '../../../shared/models';

describe('TeamMemberList', () => {
  let component: TeamMemberList;
  let fixture: ComponentFixture<TeamMemberList>;
  let teamServiceSpy: jasmine.SpyObj<TeamService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockTeam: Team = {
    id: '1',
    name: 'Data Science',
    description: 'Analytics team',
    organizationId: '10',
    members: [],
    repositories: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-01')
  };

  const mockMembers: TeamMember[] = [
    {
      id: '1', userId: '42', email: 'admin@example.com', name: 'Admin User',
      role: 'owner', status: 'active', joinedAt: new Date('2024-01-15')
    },
    {
      id: '2', userId: '43', email: 'alice@example.com', name: 'Alice Smith',
      role: 'admin', status: 'active', joinedAt: new Date('2024-01-20')
    },
    {
      id: '3', userId: '44', email: 'bob@example.com', name: 'Bob Jones',
      role: 'member', status: 'active', joinedAt: new Date('2024-02-01')
    }
  ];

  beforeEach(async () => {
    teamServiceSpy = jasmine.createSpyObj('TeamService', [
      'getTeamWithMembers', 'removeTeamMember', 'addTeamMember', 'updateMemberRole'
    ]);
    teamServiceSpy.getTeamWithMembers.and.returnValue(of({ team: mockTeam, members: mockMembers }));
    teamServiceSpy.removeTeamMember.and.returnValue(of(void 0));
    teamServiceSpy.addTeamMember.and.returnValue(of({}));
    teamServiceSpy.updateMemberRole.and.returnValue(of({}));

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [TeamMemberList, NoopAnimationsModule],
      providers: [
        { provide: TeamService, useValue: teamServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: '1' })) }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TeamMemberList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load team and members on init via single API call', () => {
    expect(teamServiceSpy.getTeamWithMembers).toHaveBeenCalledWith('1');
    expect(component.team).toEqual(mockTeam);
    expect(component.members).toEqual(mockMembers);
  });

  it('should set isLoading to false after members load', () => {
    expect(component.isLoading).toBeFalse();
  });

  it('should populate filteredMembers with all members initially', () => {
    expect(component.filteredMembers.length).toBe(3);
  });

  it('should filter members by search query', () => {
    component.searchQuery = 'alice';
    component.applyFilters();
    expect(component.filteredMembers.length).toBe(1);
    expect(component.filteredMembers[0].name).toBe('Alice Smith');
  });

  it('should filter members by email', () => {
    component.searchQuery = 'bob@';
    component.applyFilters();
    expect(component.filteredMembers.length).toBe(1);
    expect(component.filteredMembers[0].email).toBe('bob@example.com');
  });

  it('should filter members by role', () => {
    component.roleFilter = 'admin';
    component.applyFilters();
    expect(component.filteredMembers.length).toBe(1);
    expect(component.filteredMembers[0].role).toBe('admin');
  });

  it('should combine search and role filters', () => {
    component.searchQuery = 'a';
    component.roleFilter = 'owner';
    component.applyFilters();
    expect(component.filteredMembers.length).toBe(1);
    expect(component.filteredMembers[0].name).toBe('Admin User');
  });

  it('should show all members when filter is "all"', () => {
    component.roleFilter = 'all';
    component.applyFilters();
    expect(component.filteredMembers.length).toBe(3);
  });

  it('should confirm before removing a member', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.removeMember(mockMembers[2]); // Bob (member role)
    expect(window.confirm).toHaveBeenCalled();
    expect(teamServiceSpy.removeTeamMember).toHaveBeenCalledWith('1', '44');
    expect(component.members.length).toBe(2);
  });

  it('should not remove a member when confirm is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.removeMember(mockMembers[2]);
    expect(teamServiceSpy.removeTeamMember).not.toHaveBeenCalled();
  });

  it('should not remove an owner', () => {
    component.removeMember(mockMembers[0]); // Admin User (owner role)
    expect(teamServiceSpy.removeTeamMember).not.toHaveBeenCalled();
  });

  it('should set errorMessage on remove failure', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    teamServiceSpy.removeTeamMember.and.returnValue(throwError(() => new Error('fail')));
    component.removeMember(mockMembers[2]);
    expect(component.errorMessage).toBeTruthy();
  });

  it('navigateBack should navigate to /teams', () => {
    component.navigateBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/teams']);
  });

  it('trackByMemberId should return userId', () => {
    expect(component.trackByMemberId(0, mockMembers[0])).toBe('42');
  });

  it('getRoleBadgeClass should return role-specific class', () => {
    expect(component.getRoleBadgeClass('admin')).toBe('role-badge role-admin');
    expect(component.getRoleBadgeClass('owner')).toBe('role-badge role-owner');
  });

  it('should navigate to /teams when no id in route', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TeamMemberList, NoopAnimationsModule],
      providers: [
        { provide: TeamService, useValue: teamServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({})) } }
      ]
    });
    const f2 = TestBed.createComponent(TeamMemberList);
    f2.detectChanges();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/teams']);
  });

  it('should set errorMessage when loading fails', () => {
    teamServiceSpy.getTeamWithMembers.and.returnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component.errorMessage).toBeTruthy();
  });

  it('openInviteDialog should open dialog when team is loaded', () => {
    const componentDialog = fixture.debugElement.injector.get(MatDialog);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
    dialogRefSpy.afterClosed.and.returnValue(of(undefined));
    const openSpy = spyOn(componentDialog, 'open').and.returnValue(dialogRefSpy);

    component.openInviteDialog();
    expect(openSpy).toHaveBeenCalled();
  });

  it('openInviteDialog should not open dialog when team is null', () => {
    const componentDialog = fixture.debugElement.injector.get(MatDialog);
    const openSpy = spyOn(componentDialog, 'open');
    component.team = null;
    component.openInviteDialog();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('openRoleDialog should not open dialog for owner', () => {
    const componentDialog = fixture.debugElement.injector.get(MatDialog);
    const openSpy = spyOn(componentDialog, 'open');
    component.openRoleDialog(mockMembers[0]); // Admin User (owner)
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('openRoleDialog should open dialog for non-owner members', () => {
    const componentDialog = fixture.debugElement.injector.get(MatDialog);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
    dialogRefSpy.afterClosed.and.returnValue(of(undefined));
    const openSpy = spyOn(componentDialog, 'open').and.returnValue(dialogRefSpy);

    component.openRoleDialog(mockMembers[1]); // Alice (admin)
    expect(openSpy).toHaveBeenCalled();
  });

  it('processInvites should reload members when all invites succeed', () => {
    const componentDialog = fixture.debugElement.injector.get(MatDialog);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
    dialogRefSpy.afterClosed.and.returnValue(of({ emails: ['new@example.com'], role: 'member' }));
    spyOn(componentDialog, 'open').and.returnValue(dialogRefSpy);
    teamServiceSpy.addTeamMember.and.returnValue(of({}));
    teamServiceSpy.getTeamWithMembers.calls.reset();

    component.openInviteDialog();
    expect(teamServiceSpy.addTeamMember).toHaveBeenCalled();
    expect(teamServiceSpy.getTeamWithMembers).toHaveBeenCalledWith('1');
    expect(component.errorMessage).toBeNull();
  });

  it('processInvites should show error with failed emails on partial failure', () => {
    const componentDialog = fixture.debugElement.injector.get(MatDialog);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
    dialogRefSpy.afterClosed.and.returnValue(of({
      emails: ['ok@example.com', 'fail@example.com'],
      role: 'member'
    }));
    spyOn(componentDialog, 'open').and.returnValue(dialogRefSpy);

    let callCount = 0;
    teamServiceSpy.addTeamMember.and.callFake(() => {
      callCount++;
      return callCount === 2
        ? throwError(() => new Error('fail'))
        : of({});
    });
    teamServiceSpy.getTeamWithMembers.calls.reset();

    component.openInviteDialog();
    expect(teamServiceSpy.getTeamWithMembers).toHaveBeenCalled();
    expect(component.errorMessage).toContain('fail@example.com');
  });

  it('processInvites should show error when all invites fail', () => {
    const componentDialog = fixture.debugElement.injector.get(MatDialog);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
    dialogRefSpy.afterClosed.and.returnValue(of({
      emails: ['a@example.com', 'b@example.com'],
      role: 'admin'
    }));
    spyOn(componentDialog, 'open').and.returnValue(dialogRefSpy);
    teamServiceSpy.addTeamMember.and.returnValue(throwError(() => new Error('fail')));
    teamServiceSpy.getTeamWithMembers.calls.reset();

    component.openInviteDialog();
    expect(teamServiceSpy.getTeamWithMembers).toHaveBeenCalled();
    expect(component.errorMessage).toContain('a@example.com');
    expect(component.errorMessage).toContain('b@example.com');
  });
});
