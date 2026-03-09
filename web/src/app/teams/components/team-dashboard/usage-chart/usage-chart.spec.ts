import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsageChart } from './usage-chart';
import { TeamUsageStat } from '../../../../shared/models';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('UsageChart', () => {
  let component: UsageChart;
  let fixture: ComponentFixture<UsageChart>;

  const mockStats: TeamUsageStat[] = [
    { date: '2024-01-01', queryRuns: 10, dataSource: 'PostgreSQL' },
    { date: '2024-01-01', queryRuns: 5, dataSource: 'BigQuery' },
    { date: '2024-01-02', queryRuns: 20, dataSource: 'PostgreSQL' },
    { date: '2024-01-02', queryRuns: 8, dataSource: 'BigQuery' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsageChart, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(UsageChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty state when stats is empty', () => {
    component.stats = [];
    component.ngOnChanges();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.empty-state').length).toBeGreaterThan(0);
  });

  it('should build daily totals correctly', () => {
    component.stats = mockStats;
    component.ngOnChanges();
    expect(component.dailyTotals.length).toBe(2);
    expect(component.dailyTotals[0]).toEqual({ date: '2024-01-01', runs: 15 });
    expect(component.dailyTotals[1]).toEqual({ date: '2024-01-02', runs: 28 });
  });

  it('should build data source totals with percentages', () => {
    component.stats = mockStats;
    component.ngOnChanges();
    expect(component.dataSourceTotals.length).toBe(2);
    const pg = component.dataSourceTotals.find(s => s.name === 'PostgreSQL')!;
    const bq = component.dataSourceTotals.find(s => s.name === 'BigQuery')!;
    expect(pg.runs).toBe(30);
    expect(bq.runs).toBe(13);
    expect(pg.pct + bq.pct).toBe(100);
  });

  it('barHeight should return 100 for max runs', () => {
    component.stats = mockStats;
    component.ngOnChanges();
    expect(component.barHeight(component.maxRuns)).toBe(100);
  });

  it('barHeight should return 0 when maxRuns is 0', () => {
    component.stats = [];
    component.ngOnChanges();
    expect(component.barHeight(0)).toBe(0);
  });

  it('trackByDate and trackBySource should return the key fields', () => {
    const day = { date: '2024-01-01', runs: 10 };
    const src = { name: 'PostgreSQL', runs: 10, pct: 50 };
    expect(component.trackByDate(0, day)).toBe('2024-01-01');
    expect(component.trackBySource(0, src)).toBe('PostgreSQL');
  });
});
