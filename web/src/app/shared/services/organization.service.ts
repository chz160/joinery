import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Organization, OrganizationSetupWizardData, GitHubRepository, TeamInvitation } from '../models';
import { environment } from '../../../environments/environment';

/**
 * Service for managing organizations and setup wizard functionality.
 * Handles CRUD operations for organizations and wizard state management.
 */
@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private readonly apiUrl = `${environment.apiBaseUrl}/organizations`;
  private wizardDataSubject = new BehaviorSubject<OrganizationSetupWizardData | null>(null);
  public wizardData$ = this.wizardDataSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Check if user is a first-time user (has no organizations)
   */
  isFirstTimeUser(): Observable<boolean> {
    // For development: check if user has completed setup
    if (localStorage.getItem('userHasCompletedSetup') === 'true') {
      return of(false);
    }
    
    return this.getOrganizations().pipe(
      map(organizations => organizations.length === 0)
    );
  }

  /**
   * Get all organizations for the current user
   */
  getOrganizations(): Observable<Organization[]> {
    // Mock data for development - replace with actual API call
    return of([
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
        description: 'Research and analytics team workspace',
        ownerId: 'user1',
        members: [],
        authProvider: {
          type: 'github',
          config: { clientId: 'def456' }
        },
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-25')
      }
    ]);
    // TODO: Replace with actual API call
    // return this.http.get<Organization[]>(this.apiUrl);
  }

  /**
   * Create a new organization
   */
  createOrganization(organization: Partial<Organization>): Observable<Organization> {
    // Mock implementation - replace with actual API call
    const newOrg: Organization = {
      id: Date.now().toString(),
      name: organization.name!,
      description: organization.description,
      ownerId: 'current-user-id', // This would come from auth service
      members: [],
      authProvider: organization.authProvider,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return of(newOrg);
    // TODO: Replace with actual API call
    // return this.http.post<Organization>(this.apiUrl, organization);
  }

  /**
   * Update an existing organization
   */
  updateOrganization(id: string, organization: Partial<Organization>): Observable<Organization> {
    // TODO: Replace with actual API call
    return this.http.put<Organization>(`${this.apiUrl}/${id}`, organization);
  }

  /**
   * Delete an organization
   */
  deleteOrganization(id: string): Observable<void> {
    // TODO: Replace with actual API call
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Check if organization name is unique
   */
  checkOrganizationNameUniqueness(name: string): Observable<boolean> {
    // Mock implementation - replace with actual API call
    return this.getOrganizations().pipe(
      map(orgs => !orgs.some(org => 
        org.name.toLowerCase() === name.toLowerCase()
      ))
    );
  }

  /**
   * Initialize wizard data
   */
  initializeWizardData(): OrganizationSetupWizardData {
    const wizardData: OrganizationSetupWizardData = {
      organization: {
        name: '',
        description: '',
        authProvider: {
          type: 'github',
          config: { clientId: '' }
        }
      },
      repositories: [],
      teamMembers: [],
      settings: {
        defaultQueryVisibility: 'team',
        allowRepositoryIntegration: true,
        requireApprovalForQueries: false,
        enableAuditLogging: true
      },
      currentStep: 1,
      completed: false
    };

    this.wizardDataSubject.next(wizardData);
    return wizardData;
  }

  /**
   * Update wizard data
   */
  updateWizardData(data: Partial<OrganizationSetupWizardData>): void {
    const currentData = this.wizardDataSubject.value;
    if (currentData) {
      const updatedData = { ...currentData, ...data };
      this.wizardDataSubject.next(updatedData);
    }
  }

  /**
   * Get current wizard data
   */
  getWizardData(): OrganizationSetupWizardData | null {
    return this.wizardDataSubject.value;
  }

  /**
   * Complete the wizard and create organization
   */
  completeWizard(): Observable<Organization> {
    const wizardData = this.wizardDataSubject.value;
    if (!wizardData) {
      throw new Error('No wizard data available');
    }

    // Create the organization with all collected data
    return this.createOrganization(wizardData.organization).pipe(
      map(organization => {
        // Mark wizard as completed
        this.updateWizardData({ completed: true });
        
        // Mark user as having completed setup (for development)
        localStorage.setItem('userHasCompletedSetup', 'true');
        
        // TODO: Send team invitations
        // TODO: Connect repositories
        // TODO: Apply settings
        
        return organization;
      })
    );
  }

  /**
   * Clear wizard data
   */
  clearWizardData(): void {
    this.wizardDataSubject.next(null);
  }

  /**
   * Send team member invitations
   */
  sendTeamInvitations(organizationId: string, invitations: TeamInvitation[]): Observable<void> {
    // Mock implementation - replace with actual API call
    console.log('Sending invitations:', invitations);
    return of(void 0);
    // TODO: Replace with actual API call
    // return this.http.post<void>(`${this.apiUrl}/${organizationId}/invite`, { invitations });
  }
}