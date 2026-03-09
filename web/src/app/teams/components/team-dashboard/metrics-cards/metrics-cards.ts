import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedMaterialModule } from '../../../../shared/modules/material.module';
import { TeamMetrics } from '../../../../shared/models';

@Component({
  selector: 'app-metrics-cards',
  standalone: true,
  imports: [CommonModule, SharedMaterialModule],
  templateUrl: './metrics-cards.html',
  styleUrl: './metrics-cards.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricsCards {
  @Input() metrics: TeamMetrics | null = null;
}
