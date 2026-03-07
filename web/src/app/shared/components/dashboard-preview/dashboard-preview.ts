import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { SharedMaterialModule } from '../../modules/material.module';
import { BaseAuthComponent } from '../base-auth-component';
import { DashboardPreview } from '../../models';
import { DashboardPreviewService } from '../../services/dashboard-preview';

@Component({
  selector: 'app-dashboard-preview',
  imports: [
    CommonModule,
    RouterModule,
    SharedMaterialModule
  ],
  templateUrl: './dashboard-preview.html',
  styleUrl: './dashboard-preview.scss'
})
export class DashboardPreviewComponent extends BaseAuthComponent implements OnInit {
  dashboardData$: Observable<DashboardPreview>;

  constructor(
    private dashboardPreviewService: DashboardPreviewService
  ) {
    super();
    this.dashboardData$ = this.dashboardPreviewService.getDashboardPreview();
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