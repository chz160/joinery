import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Team, TeamMember, TeamMemberRole, User } from '../models';
import { environment } from '../../../environments/environment';

// Internal DTOs matching the actual backend response shapes
interface TeamListApiDto {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: number; username: string; email: string; };
  organization: { id: number; name: string; };
  memberCount: number;
  userRole: number | null;
}

interface TeamMemberApiDto {
  id: number;
  role: number;
  permissions?: number;
  effectivePermissions?: number;
  joinedAt: string;
  user: { id: number; username: string; email: string; fullName: string | null; };
}

interface TeamDetailApiDto {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: number; username: string; email: string; };
  organization: { id: number; name: string; };
  members: TeamMemberApiDto[];
  userRole: number;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  organizationId: number;
}

export interface UpdateTeamRequest {
  name: string;
  description?: string;
  organizationId: number;
}

export interface AddTeamMemberRequest {
  userId: number;
  role?: number;
  permissions?: number;
}

export interface UpdateMemberRoleRequest {
  role: number;
}

export interface UpdateMemberPermissionsRequest {
  permissions: number;
}

/**
 * Service for managing teams.
 * Handles CRUD operations for teams and member management.
 */
@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private readonly apiUrl = `${environment.apiBaseUrl}/teams`;

  constructor(private http: HttpClient) {}

  /** Map numeric backend role to display string */
  static mapRoleFromApi(role: number): TeamMemberRole {
    switch (role) {
      case 2: return 'owner';
      case 1: return 'admin';
      case 0: return 'member';
      default: return 'viewer';
    }
  }

  /** Map display role string to numeric backend value */
  static mapRoleToApi(role: TeamMemberRole): number {
    switch (role) {
      case 'owner': return 2;
      case 'admin': return 1;
      case 'member': return 0;
      case 'viewer': return -1;
    }
  }

  private mapMemberDto(dto: TeamMemberApiDto): TeamMember {
    return {
      id: String(dto.id),
      userId: String(dto.user.id),
      email: dto.user.email,
      name: dto.user.fullName || dto.user.username,
      role: TeamService.mapRoleFromApi(dto.role),
      status: 'active',
      permissions: dto.permissions,
      effectivePermissions: dto.effectivePermissions,
      joinedAt: new Date(dto.joinedAt)
    };
  }

  private mapListDto(dto: TeamListApiDto): Team {
    return {
      id: String(dto.id),
      name: dto.name,
      description: dto.description,
      organizationId: String(dto.organization.id),
      memberCount: dto.memberCount,
      members: [],
      repositories: [],
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt)
    };
  }

  private mapDetailDto(dto: TeamDetailApiDto): Team {
    return {
      id: String(dto.id),
      name: dto.name,
      description: dto.description,
      organizationId: String(dto.organization.id),
      members: dto.members.map(m => ({
        id: String(m.user.id),
        email: m.user.email,
        name: m.user.fullName || m.user.username,
        createdAt: new Date(m.joinedAt)
      } as User)),
      repositories: [],
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt)
    };
  }

  /**
   * Get all teams for the current user
   */
  getTeams(): Observable<Team[]> {
    return this.http.get<TeamListApiDto[]>(this.apiUrl).pipe(
      map(dtos => dtos.map(dto => this.mapListDto(dto)))
    );
  }

  /**
   * Get all teams for a specific organization
   */
  getTeamsByOrganization(organizationId: string): Observable<Team[]> {
    return this.http.get<TeamListApiDto[]>(`${this.apiUrl}/organization/${organizationId}`).pipe(
      map(dtos => dtos.map(dto => this.mapListDto(dto)))
    );
  }

  /**
   * Get a specific team by ID
   */
  getTeam(id: string): Observable<Team> {
    return this.http.get<TeamDetailApiDto>(`${this.apiUrl}/${id}`).pipe(
      map(dto => this.mapDetailDto(dto))
    );
  }

  /**
   * Get all members of a team with role and permission details
   */
  getTeamMembers(teamId: string): Observable<TeamMember[]> {
    return this.http.get<TeamDetailApiDto>(`${this.apiUrl}/${teamId}`).pipe(
      map(dto => dto.members.map(m => this.mapMemberDto(m)))
    );
  }

  /**
   * Create a new team
   */
  createTeam(request: CreateTeamRequest): Observable<Team> {
    return this.http.post<Partial<TeamDetailApiDto>>(this.apiUrl, request).pipe(
      map(dto => this.mapDetailDto(dto as TeamDetailApiDto))
    );
  }

  /**
   * Update an existing team
   */
  updateTeam(id: string, request: UpdateTeamRequest): Observable<Team> {
    return this.http.put<TeamDetailApiDto>(`${this.apiUrl}/${id}`, request).pipe(
      map(dto => this.mapDetailDto(dto))
    );
  }

  /**
   * Delete a team
   */
  deleteTeam(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Add a member to a team
   */
  addTeamMember(teamId: string, request: AddTeamMemberRequest): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/${teamId}/members`, request);
  }

  /**
   * Remove a member from a team
   */
  removeTeamMember(teamId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${teamId}/members/${userId}`);
  }

  /**
   * Update a team member's role
   */
  updateMemberRole(teamId: string, userId: string, request: UpdateMemberRoleRequest): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/${teamId}/members/${userId}/role`, request);
  }

  /**
   * Update a team member's granular permissions
   */
  updateMemberPermissions(teamId: string, userId: string, request: UpdateMemberPermissionsRequest): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/${teamId}/members/${userId}/permissions`, request);
  }
}
