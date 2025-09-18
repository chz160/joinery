import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  stats = {
    organizations: 3,
    teams: 8,
    queries: 42,
    repositories: 15
  };

  recentActivity = [
    { action: 'Created new query', item: 'User Analysis Report', time: '2 minutes ago' },
    { action: 'Updated team', item: 'Data Science Team', time: '1 hour ago' },
    { action: 'Linked repository', item: 'analytics-queries', time: '3 hours ago' },
    { action: 'Created organization', item: 'Acme Corp', time: '1 day ago' }
  ];
}
