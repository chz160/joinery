import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatGridListModule } from '@angular/material/grid-list';
import { Observable } from 'rxjs';
import { DashboardPreview, User } from '../../models';
import { DashboardPreviewService } from '../../services/dashboard-preview';
import { Auth } from '../../../auth/services/auth';

@Component({
  selector: 'app-dashboard-preview',
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    MatGridListModule
  ],
  templateUrl: './dashboard-preview.html',
  styleUrl: './dashboard-preview.scss'
})
export class DashboardPreviewComponent implements OnInit {
  dashboardData$: Observable<DashboardPreview>;
  currentUser$: Observable<User | null>;

  constructor(
    private dashboardPreviewService: DashboardPreviewService,
    private auth: Auth
  ) {
    this.dashboardData$ = this.dashboardPreviewService.getDashboardPreview();
    this.currentUser$ = this.auth.currentUser$;
  }

  ngOnInit(): void {
  }

  getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  getUnreadNotificationsCount(dashboardData: DashboardPreview): number {
    return dashboardData.notifications.filter(n => !n.read).length;
  }
}