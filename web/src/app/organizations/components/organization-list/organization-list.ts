import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { Organization } from '../../../shared/models';

@Component({
  selector: 'app-organization-list',
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule
  ],
  templateUrl: './organization-list.html',
  styleUrl: './organization-list.scss'
})
export class OrganizationList implements OnInit {
  organizations: Organization[] = [];
  loading = true;

  constructor() {}

  ngOnInit(): void {
    this.loadOrganizations();
  }

  loadOrganizations(): void {
    // Mock data - in real app this would come from the API service
    setTimeout(() => {
      this.organizations = [
        {
          id: '1',
          name: 'Acme Corp',
          description: 'Main corporate organization for all data analytics',
          ownerId: 'user1',
          members: [],
          authProvider: {
            type: 'microsoft',
            config: { clientId: 'abc123', domain: 'acmecorp.onmicrosoft.com' }
          },
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-02-01')
        },
        {
          id: '2',
          name: 'Data Science Division',
          description: 'Specialized team for machine learning and AI queries',
          ownerId: 'user1',
          members: [],
          authProvider: {
            type: 'github',
            config: { clientId: 'def456' }
          },
          createdAt: new Date('2024-02-10'),
          updatedAt: new Date('2024-02-15')
        },
        {
          id: '3',
          name: 'Analytics Hub',
          description: 'Central hub for business intelligence and reporting',
          ownerId: 'user2',
          members: [],
          authProvider: {
            type: 'aws-iam',
            config: { clientId: 'ghi789' }
          },
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-02-05')
        }
      ];
      this.loading = false;
    }, 1000);
  }

  createOrganization(): void {
    // TODO: Implement organization creation dialog
    console.log('Create new organization');
  }

  editOrganization(org: Organization): void {
    // TODO: Implement organization editing
    console.log('Edit organization:', org.name);
  }

  deleteOrganization(org: Organization): void {
    // TODO: Implement organization deletion
    console.log('Delete organization:', org.name);
  }

  getAuthProviderIcon(type: string): string {
    switch (type) {
      case 'microsoft': return 'business';
      case 'github': return 'code';
      case 'aws-iam': return 'cloud';
      default: return 'security';
    }
  }

  getAuthProviderName(type: string): string {
    switch (type) {
      case 'microsoft': return 'Microsoft Entra ID';
      case 'github': return 'GitHub';
      case 'aws-iam': return 'AWS IAM';
      default: return 'Unknown';
    }
  }
}
