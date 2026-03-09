import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TeamActivity, TeamDashboardTimeRange, TeamMetrics, TeamUsageStat } from '../../shared/models';
import { environment } from '../../../environments/environment';

interface TeamMetricsApiDto {
  totalQueries: number;
  activeMembers: number;
  queryRuns: number;
  avgExecutionTimeMs: number;
  topQueries: { id: number; name: string; runs: number; lastRunAt: string; }[];
  memberContributions: { userId: number; userName: string; queriesCreated: number; queryRuns: number; }[];
}

interface TeamActivityApiDto {
  id: number;
  userId: number;
  userName: string;
  action: string;
  targetType: 'query' | 'repository' | 'member' | 'team';
  targetName: string;
  timestamp: string;
}

interface TeamUsageStatApiDto {
  date: string;
  queryRuns: number;
  dataSource: string;
}

/**
 * Service for retrieving team dashboard metrics, activity, and usage statistics.
 * Falls back to mock data when the backend analytics endpoints are unavailable.
 */
@Injectable({
  providedIn: 'root'
})
export class TeamDashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/teams`;

  /**
   * Get aggregate metrics for a team over a given time range.
   */
  getTeamMetrics(teamId: string, timeRange: TeamDashboardTimeRange): Observable<TeamMetrics> {
    return this.http
      .get<TeamMetricsApiDto>(`${this.apiUrl}/${teamId}/metrics`, { params: { timeRange } })
      .pipe(
        map(dto => this.mapMetrics(dto)),
        catchError(() => of(this.mockMetrics()))
      );
  }

  /**
   * Get the recent activity feed for a team over a given time range.
   */
  getTeamActivity(teamId: string, timeRange: TeamDashboardTimeRange): Observable<TeamActivity[]> {
    return this.http
      .get<TeamActivityApiDto[]>(`${this.apiUrl}/${teamId}/activity`, { params: { timeRange } })
      .pipe(
        map(dtos => dtos.map(dto => this.mapActivity(dto))),
        catchError(() => of(this.mockActivity()))
      );
  }

  /**
   * Get per-day usage statistics for a team over a given time range.
   */
  getTeamUsage(teamId: string, timeRange: TeamDashboardTimeRange): Observable<TeamUsageStat[]> {
    return this.http
      .get<TeamUsageStatApiDto[]>(`${this.apiUrl}/${teamId}/usage`, { params: { timeRange } })
      .pipe(
        map(dtos => dtos.map(dto => ({ ...dto }))),
        catchError(() => of(this.mockUsage(timeRange)))
      );
  }

  private mapMetrics(dto: TeamMetricsApiDto): TeamMetrics {
    return {
      totalQueries: dto.totalQueries,
      activeMembers: dto.activeMembers,
      queryRuns: dto.queryRuns,
      avgExecutionTimeMs: dto.avgExecutionTimeMs,
      topQueries: dto.topQueries.map(q => ({
        id: String(q.id),
        name: q.name,
        runs: q.runs,
        lastRunAt: new Date(q.lastRunAt)
      })),
      memberContributions: dto.memberContributions.map(m => ({
        userId: String(m.userId),
        userName: m.userName,
        queriesCreated: m.queriesCreated,
        queryRuns: m.queryRuns
      }))
    };
  }

  private mapActivity(dto: TeamActivityApiDto): TeamActivity {
    return {
      id: String(dto.id),
      userId: String(dto.userId),
      userName: dto.userName,
      action: dto.action,
      targetType: dto.targetType,
      targetName: dto.targetName,
      timestamp: new Date(dto.timestamp)
    };
  }

  private mockMetrics(): TeamMetrics {
    return {
      totalQueries: 42,
      activeMembers: 5,
      queryRuns: 318,
      avgExecutionTimeMs: 245,
      topQueries: [
        { id: '1', name: 'User Analysis Report', runs: 87, lastRunAt: new Date() },
        { id: '2', name: 'Revenue Summary', runs: 64, lastRunAt: new Date() },
        { id: '3', name: 'Daily Active Users', runs: 52, lastRunAt: new Date() },
        { id: '4', name: 'Cohort Retention', runs: 43, lastRunAt: new Date() },
        { id: '5', name: 'Funnel Analysis', runs: 31, lastRunAt: new Date() }
      ],
      memberContributions: [
        { userId: '1', userName: 'alice', queriesCreated: 14, queryRuns: 120 },
        { userId: '2', userName: 'bob', queriesCreated: 10, queryRuns: 98 },
        { userId: '3', userName: 'carol', queriesCreated: 8, queryRuns: 56 },
        { userId: '4', userName: 'dave', queriesCreated: 6, queryRuns: 30 },
        { userId: '5', userName: 'eve', queriesCreated: 4, queryRuns: 14 }
      ]
    };
  }

  private mockActivity(): TeamActivity[] {
    const now = new Date();
    const ago = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000);
    return [
      { id: '1', userId: '1', userName: 'alice', action: 'Created query', targetType: 'query', targetName: 'User Analysis Report', timestamp: ago(5) },
      { id: '2', userId: '2', userName: 'bob', action: 'Ran query', targetType: 'query', targetName: 'Revenue Summary', timestamp: ago(30) },
      { id: '3', userId: '3', userName: 'carol', action: 'Updated query', targetType: 'query', targetName: 'Daily Active Users', timestamp: ago(90) },
      { id: '4', userId: '4', userName: 'dave', action: 'Linked repository', targetType: 'repository', targetName: 'analytics-queries', timestamp: ago(180) },
      { id: '5', userId: '1', userName: 'alice', action: 'Invited member', targetType: 'member', targetName: 'frank@example.com', timestamp: ago(360) },
      { id: '6', userId: '2', userName: 'bob', action: 'Ran query', targetType: 'query', targetName: 'Cohort Retention', timestamp: ago(720) }
    ];
  }

  private mockUsage(timeRange: TeamDashboardTimeRange): TeamUsageStat[] {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const stats: TeamUsageStat[] = [];
    const dataSources = ['PostgreSQL', 'BigQuery', 'Redshift'];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dataSources.forEach(ds => {
        stats.push({
          date: dateStr,
          queryRuns: Math.floor(Math.random() * 30) + 5,
          dataSource: ds
        });
      });
    }
    return stats;
  }
}
