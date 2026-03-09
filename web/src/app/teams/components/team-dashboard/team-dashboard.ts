import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SharedMaterialModule } from '../../../shared/modules/material.module';
import { TeamDashboardService } from '../../services/team-dashboard.service';
import { TeamService } from '../../../shared/services/team.service';
import { MetricsCards } from './metrics-cards/metrics-cards';
import { ActivityFeed } from './activity-feed/activity-feed';
import { UsageChart } from './usage-chart/usage-chart';
import {
  Team,
  TeamMetrics,
  TeamActivity,
  TeamUsageStat,
  TeamDashboardTimeRange,
  TopQuery,
  MemberContribution
} from '../../../shared/models';

const AUTO_REFRESH_INTERVAL_MS = 60_000;

@Component({
  selector: 'app-team-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedMaterialModule,
    MetricsCards,
    ActivityFeed,
    UsageChart
  ],
  templateUrl: './team-dashboard.html',
  styleUrl: './team-dashboard.scss'
})
export class TeamDashboard implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dashboardService = inject(TeamDashboardService);
  private readonly teamService = inject(TeamService);
  private readonly destroy$ = new Subject<void>();

  team: Team | null = null;
  metrics: TeamMetrics | null = null;
  activities: TeamActivity[] = [];
  usageStats: TeamUsageStat[] = [];

  isLoadingMetrics = false;
  isLoadingActivity = false;
  isLoadingUsage = false;
  errorMessage: string | null = null;

  selectedTimeRange: TeamDashboardTimeRange = '30d';
  timeRangeOptions: { value: TeamDashboardTimeRange; label: string }[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' }
  ];

  trackByTopQuery(_: number, item: TopQuery): string {
    return item.id;
  }

  trackByContribution(_: number, item: MemberContribution): string {
    return item.userId;
  }

  trackByTimeRangeOption(_: number, item: { value: TeamDashboardTimeRange; label: string }): string {
    return item.value;
  }

  private teamId: string | null = null;

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

      this.teamService.getTeam(id).pipe(takeUntil(this.destroy$)).subscribe({
        next: team => { this.team = team; },
        error: () => { this.errorMessage = 'Failed to load team information.'; }
      });

      this.loadData(id);
    });

    // Auto-refresh every minute
    interval(AUTO_REFRESH_INTERVAL_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.teamId) {
          this.loadData(this.teamId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTimeRangeChange(): void {
    if (this.teamId) {
      this.loadData(this.teamId);
    }
  }

  exportData(): void {
    if (!this.metrics) return;
    const payload = {
      team: this.team?.name ?? 'Team',
      timeRange: this.selectedTimeRange,
      metrics: this.metrics,
      activities: this.activities,
      usageStats: this.usageStats
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `team-dashboard-${this.selectedTimeRange}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  navigateBack(): void {
    this.router.navigate(['/teams']);
  }

  private loadData(teamId: string): void {
    this.loadMetrics(teamId);
    this.loadActivity(teamId);
    this.loadUsage(teamId);
  }

  private loadMetrics(teamId: string): void {
    this.isLoadingMetrics = true;
    this.dashboardService.getTeamMetrics(teamId, this.selectedTimeRange)
      .pipe(takeUntil(this.destroy$))
      .subscribe(metrics => {
        this.metrics = metrics;
        this.isLoadingMetrics = false;
      });
  }

  private loadActivity(teamId: string): void {
    this.isLoadingActivity = true;
    this.dashboardService.getTeamActivity(teamId, this.selectedTimeRange)
      .pipe(takeUntil(this.destroy$))
      .subscribe(activities => {
        this.activities = activities;
        this.isLoadingActivity = false;
      });
  }

  private loadUsage(teamId: string): void {
    this.isLoadingUsage = true;
    this.dashboardService.getTeamUsage(teamId, this.selectedTimeRange)
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.usageStats = stats;
        this.isLoadingUsage = false;
      });
  }
}
