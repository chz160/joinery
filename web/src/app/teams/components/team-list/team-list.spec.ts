import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { TeamList } from './team-list';
import { TeamService } from '../../../shared/services/team.service';
import { ProviderService } from '../../../shared/services/provider.service';
import { Team } from '../../../shared/models';

describe('TeamList', () => {
  let component: TeamList;
  let fixture: ComponentFixture<TeamList>;
  let teamServiceSpy: jasmine.SpyObj<TeamService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockTeams: Team[] = [
    {
      id: '1',
      name: 'Data Science Team',
      description: 'Advanced analytics',
      organizationId: '10',
      members: [],
      repositories: [],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-02-01')
    }
  ];

  beforeEach(async () => {
    teamServiceSpy = jasmine.createSpyObj('TeamService', ['getTeams']);
    teamServiceSpy.getTeams.and.returnValue(of(mockTeams));
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [TeamList],
      providers: [
        { provide: TeamService, useValue: teamServiceSpy },
        { provide: Router, useValue: routerSpy },
        ProviderService
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load teams on init', () => {
    expect(teamServiceSpy.getTeams).toHaveBeenCalled();
    expect(component.teams).toEqual(mockTeams);
  });

  it('should set isLoading to false after teams load', () => {
    expect(component.isLoading).toBeFalse();
  });

  it('should set errorMessage on load failure', () => {
    spyOn(console, 'error');
    teamServiceSpy.getTeams.and.returnValue(throwError(() => new Error('Network error')));
    component.loadTeams();
    expect(component.errorMessage).toBeTruthy();
    expect(component.isLoading).toBeFalse();
  });

  it('trackByTeamId should return the team id', () => {
    expect(component.trackByTeamId(0, mockTeams[0])).toBe('1');
  });

  it('viewDashboard should navigate to the team dashboard route', () => {
    component.viewDashboard(mockTeams[0]);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/teams', '1', 'dashboard']);
  });

  it('manageMembers should navigate to the team members route', () => {
    component.manageMembers(mockTeams[0]);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/teams', '1', 'members']);
  });
});
