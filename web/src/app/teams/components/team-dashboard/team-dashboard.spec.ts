import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TeamDashboard } from './team-dashboard';
import { TeamDashboardService } from '../../services/team-dashboard.service';
import { TeamService } from '../../../shared/services/team.service';
import { TeamMetrics, TeamActivity, TeamUsageStat, Team } from '../../../shared/models';

describe('TeamDashboard', () => {
  let component: TeamDashboard;
  let fixture: ComponentFixture<TeamDashboard>;
  let dashboardServiceSpy: jasmine.SpyObj<TeamDashboardService>;
  let teamServiceSpy: jasmine.SpyObj<TeamService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockTeam: Team = {
    id: '1',
    name: 'Data Science',
    description: 'Data team',
    organizationId: '10',
    members: [],
    repositories: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockMetrics: TeamMetrics = {
    totalQueries: 10,
    activeMembers: 3,
    queryRuns: 50,
    avgExecutionTimeMs: 120,
    topQueries: [{ id: '1', name: 'Q1', runs: 20, lastRunAt: new Date() }],
    memberContributions: [{ userId: '1', userName: 'alice', queriesCreated: 5, queryRuns: 30 }]
  };

  const mockActivities: TeamActivity[] = [
    { id: '1', userId: '1', userName: 'alice', action: 'Created query', targetType: 'query', targetName: 'Q1', timestamp: new Date() }
  ];

  const mockUsage: TeamUsageStat[] = [
    { date: '2024-01-01', queryRuns: 10, dataSource: 'PostgreSQL' }
  ];

  beforeEach(async () => {
    dashboardServiceSpy = jasmine.createSpyObj('TeamDashboardService', [
      'getTeamMetrics', 'getTeamActivity', 'getTeamUsage'
    ]);
    teamServiceSpy = jasmine.createSpyObj('TeamService', ['getTeam']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    dashboardServiceSpy.getTeamMetrics.and.returnValue(of(mockMetrics));
    dashboardServiceSpy.getTeamActivity.and.returnValue(of(mockActivities));
    dashboardServiceSpy.getTeamUsage.and.returnValue(of(mockUsage));
    teamServiceSpy.getTeam.and.returnValue(of(mockTeam));

    await TestBed.configureTestingModule({
      imports: [TeamDashboard, NoopAnimationsModule],
      providers: [
        { provide: TeamDashboardService, useValue: dashboardServiceSpy },
        { provide: TeamService, useValue: teamServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TeamDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load team and dashboard data on init', () => {
    expect(teamServiceSpy.getTeam).toHaveBeenCalledWith('1');
    expect(dashboardServiceSpy.getTeamMetrics).toHaveBeenCalled();
    expect(dashboardServiceSpy.getTeamActivity).toHaveBeenCalled();
    expect(dashboardServiceSpy.getTeamUsage).toHaveBeenCalled();
  });

  it('should populate team, metrics, activities, and usage', () => {
    expect(component.team).toEqual(mockTeam);
    expect(component.metrics).toEqual(mockMetrics);
    expect(component.activities).toEqual(mockActivities);
    expect(component.usageStats).toEqual(mockUsage);
  });

  it('should set isLoading flags to false after data loads', () => {
    expect(component.isLoadingMetrics).toBeFalse();
    expect(component.isLoadingActivity).toBeFalse();
    expect(component.isLoadingUsage).toBeFalse();
  });

  it('should navigate to /teams when no teamId in route', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TeamDashboard, NoopAnimationsModule],
      providers: [
        { provide: TeamDashboardService, useValue: dashboardServiceSpy },
        { provide: TeamService, useValue: teamServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } }
      ]
    });
    const f2 = TestBed.createComponent(TeamDashboard);
    f2.detectChanges();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/teams']);
  });

  it('should set errorMessage when team loading fails', () => {
    teamServiceSpy.getTeam.and.returnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component.errorMessage).toBeTruthy();
  });

  it('navigateBack should navigate to /teams', () => {
    component.navigateBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/teams']);
  });

  it('onTimeRangeChange should reload data', () => {
    dashboardServiceSpy.getTeamMetrics.calls.reset();
    component.onTimeRangeChange();
    expect(dashboardServiceSpy.getTeamMetrics).toHaveBeenCalled();
  });

  it('exportData should not throw when metrics is present', () => {
    spyOn(document, 'createElement').and.callThrough();
    expect(() => component.exportData()).not.toThrow();
  });

  it('exportData should not execute when metrics is null', () => {
    component.metrics = null;
    const createSpy = spyOn(document, 'createElement').and.callThrough();
    component.exportData();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('should default time range to 30d', () => {
    expect(component.selectedTimeRange).toBe('30d');
  });

  it('should have 3 time range options', () => {
    expect(component.timeRangeOptions.length).toBe(3);
  });

  it('trackByTopQuery should return query id', () => {
    expect(component.trackByTopQuery(0, mockMetrics.topQueries[0])).toBe('1');
  });

  it('trackByContribution should return userId', () => {
    expect(component.trackByContribution(0, mockMetrics.memberContributions[0])).toBe('1');
  });
});
