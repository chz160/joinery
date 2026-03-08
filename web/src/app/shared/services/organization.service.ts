import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Organization, OrganizationSetupWizardData, GitHubRepository, TeamInvitation, User } from '../models';
import { environment } from '../../../environments/environment';

// Internal DTOs matching the actual backend response shapes
interface OrganizationListApiDto {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: number; username: string; email: string; };
  memberCount: number;
  teamCount: number;
  userRole: number;
}

interface OrganizationDetailApiDto {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: number; username: string; email: string; };
  members: {
    id: number;
    role: number;
    joinedAt: string;
    user: { id: number; username: string; email: string; fullName: string; };
  }[];
  userRole: number;
}

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

  private mapListDto(dto: OrganizationListApiDto): Organization {
    return {
      id: String(dto.id),
      name: dto.name,
      description: dto.description,
      ownerId: String(dto.createdBy.id),
      members: [],
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt)
    };
  }

  private mapDetailDto(dto: OrganizationDetailApiDto): Organization {
    return {
      id: String(dto.id),
      name: dto.name,
      description: dto.description,
      ownerId: String(dto.createdBy.id),
      members: dto.members.map(m => ({
        id: String(m.user.id),
        email: m.user.email,
        name: m.user.fullName || m.user.username,
        createdAt: new Date(m.joinedAt)
      } as User)),
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt)
    };
  }

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
    return this.http.get<OrganizationListApiDto[]>(this.apiUrl).pipe(
      map(dtos => dtos.map(dto => this.mapListDto(dto)))
    );
  }

  /**
   * Create a new organization
   */
  createOrganization(organization: Partial<Organization>): Observable<Organization> {
    const payload = {
      name: organization.name,
      description: organization.description
    };
    return this.http.post<OrganizationDetailApiDto>(this.apiUrl, payload).pipe(
      map(dto => this.mapDetailDto(dto))
    );
  }

  /**
   * Update an existing organization
   */
  updateOrganization(id: string, organization: Partial<Organization>): Observable<Organization> {
    const payload = {
      name: organization.name,
      description: organization.description
    };
    return this.http.put<OrganizationDetailApiDto>(`${this.apiUrl}/${id}`, payload).pipe(
      map(dto => this.mapDetailDto(dto))
    );
  }

  /**
   * Delete an organization
   */
  deleteOrganization(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Check if organization name is unique
   */
  checkOrganizationNameUniqueness(name: string): Observable<boolean> {
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