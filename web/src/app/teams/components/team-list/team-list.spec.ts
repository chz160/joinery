import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { TeamList } from './team-list';
import { TeamService } from '../../../shared/services/team.service';
import { ProviderService } from '../../../shared/services/provider.service';
import { Team } from '../../../shared/models';

describe('TeamList', () => {
  let component: TeamList;
  let fixture: ComponentFixture<TeamList>;
  let teamServiceSpy: jasmine.SpyObj<TeamService>;

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

    await TestBed.configureTestingModule({
      imports: [TeamList],
      providers: [
        { provide: TeamService, useValue: teamServiceSpy },
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
});
