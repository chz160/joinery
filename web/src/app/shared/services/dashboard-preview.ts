import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DashboardPreview, Query } from '../models';
import { environment } from '../../../environments/environment';

// Internal DTOs matching the backend response shapes (ASP.NET Core camelCase serialization)

interface OrganizationListDto {
  id: number;
  name: string;
}

interface TeamListDto {
  id: number;
  name: string;
}

interface GitRepositoryListDto {
  id: number;
  name: string;
}

interface QueryApiDto {
  id: number;
  name: string;
  sqlQuery: string;
  description?: string;
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
  databaseType?: string;
  tags?: string[];
  source: string;
}

const EMPTY_PREVIEW: DashboardPreview = {
  stats: { organizations: 0, teams: 0, queries: 0, repositories: 0 },
  recentActivity: [],
  recentQueries: [],
  notifications: []
};

@Injectable({
  providedIn: 'root'
})
export class DashboardPreviewService {
  private readonly orgsUrl = `${environment.apiBaseUrl}/organizations`;
  private readonly teamsUrl = `${environment.apiBaseUrl}/teams`;
  private readonly queriesUrl = `${environment.apiBaseUrl}/queries`;
  private readonly reposUrl = `${environment.apiBaseUrl}/gitrepositories`;

  constructor(private http: HttpClient) {}

  /**
   * Get dashboard preview data for authenticated user
   */
  getDashboardPreview(): Observable<DashboardPreview> {
    return forkJoin({
      orgs: this.http.get<OrganizationListDto[]>(this.orgsUrl).pipe(catchError(() => of([] as OrganizationListDto[]))),
      teams: this.http.get<TeamListDto[]>(this.teamsUrl).pipe(catchError(() => of([] as TeamListDto[]))),
      queries: this.http.get<QueryApiDto[]>(this.queriesUrl).pipe(catchError(() => of([] as QueryApiDto[]))),
      repos: this.http.get<GitRepositoryListDto[]>(this.reposUrl).pipe(catchError(() => of([] as GitRepositoryListDto[])))
    }).pipe(
      map(({ orgs, teams, queries, repos }) => ({
        stats: {
          organizations: orgs.length,
          teams: teams.length,
          queries: queries.length,
          repositories: repos.length
        },
        recentActivity: [],
        recentQueries: queries
          .filter(q => q.createdAt != null && q.updatedAt != null)
          .slice(0, 3)
          .map(q => ({
            id: String(q.id),
            name: q.name,
            description: q.description,
            content: q.sqlQuery,
            authorId: q.createdBy,
            tags: q.tags ?? [],
            createdAt: new Date(q.createdAt!),
            updatedAt: new Date(q.updatedAt!)
          } as Query)),
        notifications: []
      })),
      catchError(() => of(EMPTY_PREVIEW))
    );
  }
}