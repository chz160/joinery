import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SharedMaterialModule } from '../../../shared/modules/material.module';

/**
 * Organization Setup Success Page
 * Shows confirmation that organization was created successfully and provides next steps
 */
@Component({
  selector: 'app-organization-setup-success',
  imports: [
    CommonModule,
    SharedMaterialModule
  ],
  templateUrl: './organization-setup-success.html',
  styleUrl: './organization-setup-success.scss'
})
export class OrganizationSetupSuccess implements OnInit {
  organizationName: string = '';
  organizationId: string = '';
  invitationsSent: number = 0;
  repositoriesConnected: number = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get organization details from query parameters
    this.route.queryParams.subscribe(params => {
      this.organizationName = params['name'] || 'Your Organization';
      this.organizationId = params['id'] || '';
      this.invitationsSent = parseInt(params['invitations']) || 0;
      this.repositoriesConnected = parseInt(params['repositories']) || 0;
    });

    // Auto-redirect after 10 seconds
    setTimeout(() => {
      this.goToDashboard();
    }, 10000);
  }

  /**
   * Navigate to organization dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Navigate to organization settings
   */
  goToOrganizationSettings(): void {
    if (this.organizationId) {
      this.router.navigate(['/organizations', this.organizationId, 'settings']);
    } else {
      this.router.navigate(['/organizations']);
    }
  }

  /**
   * Invite more team members
   */
  inviteMoreMembers(): void {
    if (this.organizationId) {
      this.router.navigate(['/organizations', this.organizationId, 'invite']);
    } else {
      this.router.navigate(['/organizations']);
    }
  }

  /**
   * Connect more repositories
   */
  connectMoreRepositories(): void {
    if (this.organizationId) {
      this.router.navigate(['/organizations', this.organizationId, 'repositories']);
    } else {
      this.router.navigate(['/organizations']);
    }
  }
}