import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedMaterialModule } from '../../../../shared/modules/material.module';
import { TeamActivity } from '../../../../shared/models';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule, SharedMaterialModule],
  templateUrl: './activity-feed.html',
  styleUrl: './activity-feed.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityFeed {
  @Input() activities: TeamActivity[] = [];

  trackByActivityId(_: number, activity: TeamActivity): string {
    return activity.id;
  }

  getActivityIcon(targetType: TeamActivity['targetType']): string {
    const icons: Record<TeamActivity['targetType'], string> = {
      query: 'search',
      repository: 'source',
      member: 'person',
      team: 'groups'
    };
    return icons[targetType] ?? 'info';
  }
}
