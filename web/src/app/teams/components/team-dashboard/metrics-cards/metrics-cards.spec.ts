import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetricsCards } from './metrics-cards';
import { TeamMetrics } from '../../../../shared/models';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('MetricsCards', () => {
  let component: MetricsCards;
  let fixture: ComponentFixture<MetricsCards>;

  const mockMetrics: TeamMetrics = {
    totalQueries: 42,
    activeMembers: 5,
    queryRuns: 318,
    avgExecutionTimeMs: 245,
    topQueries: [],
    memberContributions: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricsCards, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MetricsCards);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display zero values when metrics is null', () => {
    fixture.componentRef.setInput('metrics', null);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const numbers = compiled.querySelectorAll('.metric-number');
    numbers.forEach(n => expect(n.textContent).toContain('0'));
  });

  it('should display metric values when metrics is provided', () => {
    fixture.componentRef.setInput('metrics', mockMetrics);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('42');
    expect(compiled.textContent).toContain('5');
    expect(compiled.textContent).toContain('318');
    expect(compiled.textContent).toContain('245');
  });
});
