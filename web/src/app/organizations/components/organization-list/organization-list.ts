import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedMaterialModule } from '../../../shared/modules/material.module';
import { ProviderService } from '../../../shared/services/provider.service';
import { OrganizationService } from '../../../shared/services/organization.service';
import { Organization } from '../../../shared/models';

@Component({
  selector: 'app-organization-list',
  imports: [
    CommonModule,
    RouterModule,
    SharedMaterialModule
  ],
  templateUrl: './organization-list.html',
  styleUrl: './organization-list.scss'
})
export class OrganizationList implements OnInit {
  organizations: Organization[] = [];
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private providerService: ProviderService,
    private organizationService: OrganizationService
  ) {}

  ngOnInit(): void {
    this.loadOrganizations();
  }

  loadOrganizations(): void {
    this.loading = true;
    this.errorMessage = null;
    this.organizationService.getOrganizations().subscribe({
      next: (orgs) => {
        this.organizations = orgs;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load organizations', err);
        this.errorMessage = 'Failed to load organizations. Please try again.';
        this.loading = false;
      }
    });
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
    return this.providerService.getAuthProviderIcon(type);
  }

  getAuthProviderName(type: string): string {
    return this.providerService.getAuthProviderName(type);
  }
}
