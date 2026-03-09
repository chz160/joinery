import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityFeed } from './activity-feed';
import { TeamActivity } from '../../../../shared/models';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ActivityFeed', () => {
  let component: ActivityFeed;
  let fixture: ComponentFixture<ActivityFeed>;

  const mockActivities: TeamActivity[] = [
    {
      id: '1',
      userId: '1',
      userName: 'alice',
      action: 'Created query',
      targetType: 'query',
      targetName: 'User Report',
      timestamp: new Date('2024-01-10T10:00:00Z')
    },
    {
      id: '2',
      userId: '2',
      userName: 'bob',
      action: 'Linked repository',
      targetType: 'repository',
      targetName: 'analytics-queries',
      timestamp: new Date('2024-01-09T08:30:00Z')
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityFeed, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityFeed);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty state when activities array is empty', () => {
    fixture.componentRef.setInput('activities', []);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-state')).toBeTruthy();
  });

  it('should render activity items', () => {
    fixture.componentRef.setInput('activities', mockActivities);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.activity-item').length).toBe(2);
    expect(compiled.textContent).toContain('alice');
    expect(compiled.textContent).toContain('User Report');
    expect(compiled.textContent).toContain('bob');
    expect(compiled.textContent).toContain('analytics-queries');
  });

  it('trackByActivityId should return the activity id', () => {
    expect(component.trackByActivityId(0, mockActivities[0])).toBe('1');
  });

  it('getActivityIcon should return correct icons for each target type', () => {
    expect(component.getActivityIcon('query')).toBe('search');
    expect(component.getActivityIcon('repository')).toBe('source');
    expect(component.getActivityIcon('member')).toBe('person');
    expect(component.getActivityIcon('team')).toBe('groups');
  });
});
