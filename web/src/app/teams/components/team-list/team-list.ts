import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { Team, Repository } from '../../../shared/models';

@Component({
  selector: 'app-team-list',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule
  ],
  templateUrl: './team-list.html',
  styleUrl: './team-list.scss'
})
export class TeamList implements OnInit {
  teams: Team[] = [];

  constructor() {}

  ngOnInit(): void {
    this.loadTeams();
  }

  loadTeams(): void {
    // Mock data showing teams with linked repositories
    this.teams = [
      {
        id: '1',
        name: 'Data Science Team',
        description: 'Advanced analytics and machine learning',
        organizationId: '1',
        members: [],
        repositories: [
          {
            id: 'r1',
            name: 'ml-models',
            url: 'https://github.com/acme/ml-models',
            provider: 'github',
            queries: [],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'r2', 
            name: 'analytics-queries',
            url: 'https://github.com/acme/analytics-queries',
            provider: 'github',
            queries: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-02-01')
      },
      {
        id: '2',
        name: 'Backend Engineering',
        description: 'API development and infrastructure',
        organizationId: '1',
        members: [],
        repositories: [
          {
            id: 'r3',
            name: 'joinery-server',
            url: 'https://github.com/acme/joinery-server',
            provider: 'github',
            queries: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-02-05')
      },
      {
        id: '3',
        name: 'Business Intelligence',
        description: 'Reporting and business analytics',
        organizationId: '2',
        members: [],
        repositories: [
          {
            id: 'r4',
            name: 'bi-reports',
            url: 'https://dev.azure.com/acme/bi-reports',
            provider: 'azure-devops',
            queries: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-10')
      }
    ];
  }

  getProviderIcon(provider: string): string {
    switch (provider) {
      case 'github': return 'code';
      case 'gitlab': return 'merge_type';
      case 'bitbucket': return 'account_tree';
      case 'azure-devops': return 'cloud';
      default: return 'source';
    }
  }
}
