import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TeamDashboardService } from './team-dashboard.service';
import { environment } from '../../../environments/environment';

describe('TeamDashboardService', () => {
  let service: TeamDashboardService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiBaseUrl}/teams`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TeamDashboardService]
    });
    service = TestBed.inject(TeamDashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTeamMetrics', () => {
    it('should fetch and map metrics from the API', () => {
      const dto = {
        totalQueries: 10,
        activeMembers: 3,
        queryRuns: 50,
        avgExecutionTimeMs: 120,
        topQueries: [{ id: 1, name: 'Q1', runs: 20, lastRunAt: '2024-01-01T00:00:00Z' }],
        memberContributions: [{ userId: 1, userName: 'alice', queriesCreated: 5, queryRuns: 30 }]
      };

      service.getTeamMetrics('1', '30d').subscribe(metrics => {
        expect(metrics.totalQueries).toBe(10);
        expect(metrics.activeMembers).toBe(3);
        expect(metrics.queryRuns).toBe(50);
        expect(metrics.avgExecutionTimeMs).toBe(120);
        expect(metrics.topQueries.length).toBe(1);
        expect(metrics.topQueries[0].id).toBe('1');
        expect(metrics.topQueries[0].name).toBe('Q1');
        expect(metrics.memberContributions.length).toBe(1);
        expect(metrics.memberContributions[0].userId).toBe('1');
        expect(metrics.memberContributions[0].userName).toBe('alice');
      });

      const req = httpMock.expectOne(r => r.url === `${apiUrl}/1/metrics`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('timeRange')).toBe('30d');
      req.flush(dto);
    });

    it('should fall back to mock data on HTTP error', () => {
      let resolved = false;
      service.getTeamMetrics('1', '7d').subscribe(metrics => {
        expect(metrics.totalQueries).toBeGreaterThan(0);
        resolved = true;
      });

      const req = httpMock.expectOne(r => r.url === `${apiUrl}/1/metrics`);
      req.error(new ProgressEvent('error'));
      expect(resolved).toBeTrue();
    });
  });

  describe('getTeamActivity', () => {
    it('should fetch and map activity from the API', () => {
      const dto = [{
        id: 1,
        userId: 2,
        userName: 'bob',
        action: 'Created query',
        targetType: 'query' as const,
        targetName: 'My Query',
        timestamp: '2024-01-10T12:00:00Z'
      }];

      service.getTeamActivity('1', '30d').subscribe(activities => {
        expect(activities.length).toBe(1);
        expect(activities[0].id).toBe('1');
        expect(activities[0].userId).toBe('2');
        expect(activities[0].userName).toBe('bob');
        expect(activities[0].action).toBe('Created query');
        expect(activities[0].targetType).toBe('query');
        expect(activities[0].targetName).toBe('My Query');
        expect(activities[0].timestamp).toEqual(new Date('2024-01-10T12:00:00Z'));
      });

      const req = httpMock.expectOne(r => r.url === `${apiUrl}/1/activity`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('timeRange')).toBe('30d');
      req.flush(dto);
    });

    it('should fall back to mock data on HTTP error', () => {
      let resolved = false;
      service.getTeamActivity('1', '7d').subscribe(activities => {
        expect(activities.length).toBeGreaterThan(0);
        resolved = true;
      });

      const req = httpMock.expectOne(r => r.url === `${apiUrl}/1/activity`);
      req.error(new ProgressEvent('error'));
      expect(resolved).toBeTrue();
    });
  });

  describe('getTeamUsage', () => {
    it('should fetch usage stats from the API', () => {
      const dto = [{ date: '2024-01-01', queryRuns: 15, dataSource: 'PostgreSQL' }];

      service.getTeamUsage('1', '30d').subscribe(stats => {
        expect(stats.length).toBe(1);
        expect(stats[0].date).toBe('2024-01-01');
        expect(stats[0].queryRuns).toBe(15);
        expect(stats[0].dataSource).toBe('PostgreSQL');
      });

      const req = httpMock.expectOne(r => r.url === `${apiUrl}/1/usage`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('timeRange')).toBe('30d');
      req.flush(dto);
    });

    it('should fall back to mock data on HTTP error', () => {
      let resolved = false;
      service.getTeamUsage('1', '7d').subscribe(stats => {
        // 7 days × 3 data sources = 21 entries
        expect(stats.length).toBe(21);
        resolved = true;
      });

      const req = httpMock.expectOne(r => r.url === `${apiUrl}/1/usage`);
      req.error(new ProgressEvent('error'));
      expect(resolved).toBeTrue();
    });

    it('should produce 90 days × 3 data sources when timeRange is 90d', () => {
      service.getTeamUsage('1', '90d').subscribe(stats => {
        expect(stats.length).toBe(270);
      });

      const req = httpMock.expectOne(r => r.url === `${apiUrl}/1/usage`);
      req.error(new ProgressEvent('error'));
    });
  });
});
