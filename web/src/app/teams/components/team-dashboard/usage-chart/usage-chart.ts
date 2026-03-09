import { Component, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedMaterialModule } from '../../../../shared/modules/material.module';
import { TeamUsageStat } from '../../../../shared/models';

interface DailyTotal {
  date: string;
  runs: number;
}

interface DataSourceTotal {
  name: string;
  runs: number;
  pct: number;
}

@Component({
  selector: 'app-usage-chart',
  standalone: true,
  imports: [CommonModule, SharedMaterialModule],
  templateUrl: './usage-chart.html',
  styleUrl: './usage-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsageChart implements OnChanges {
  @Input() stats: TeamUsageStat[] = [];

  dailyTotals: DailyTotal[] = [];
  dataSourceTotals: DataSourceTotal[] = [];
  maxRuns = 1;

  ngOnChanges(): void {
    this.buildDailyTotals();
    this.buildDataSourceTotals();
  }

  trackByDate(_: number, item: DailyTotal): string {
    return item.date;
  }

  trackBySource(_: number, item: DataSourceTotal): string {
    return item.name;
  }

  barHeight(runs: number): number {
    return this.maxRuns > 0 ? Math.round((runs / this.maxRuns) * 100) : 0;
  }

  private buildDailyTotals(): void {
    const totalsMap = new Map<string, number>();
    for (const stat of this.stats) {
      totalsMap.set(stat.date, (totalsMap.get(stat.date) ?? 0) + stat.queryRuns);
    }
    this.dailyTotals = Array.from(totalsMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, runs]) => ({ date, runs }));
    this.maxRuns = this.dailyTotals.reduce((m, d) => Math.max(m, d.runs), 1);
  }

  private buildDataSourceTotals(): void {
    const sourceMap = new Map<string, number>();
    for (const stat of this.stats) {
      sourceMap.set(stat.dataSource, (sourceMap.get(stat.dataSource) ?? 0) + stat.queryRuns);
    }
    const total = Array.from(sourceMap.values()).reduce((s, v) => s + v, 0) || 1;
    this.dataSourceTotals = Array.from(sourceMap.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([name, runs]) => ({ name, runs, pct: Math.round((runs / total) * 100) }));
  }
}
