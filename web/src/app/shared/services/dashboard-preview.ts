import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { DashboardPreview, Query } from '../models';
import { environment } from '../../../environments/environment';

// Internal DTOs matching the backend response shapes

interface OrganizationListDto {
  id: number;
  name: string;
}

interface TeamListDto {
  id: number;
  name: string;
}

interface GitRepositoryListDto {
  Id: number;
  Name: string;
}

interface QueryApiDto {
  Id: number;
  Name: string;
  SqlQuery: string;
  Description?: string;
  CreatedBy: string;
  CreatedAt: string;
  UpdatedAt: string;
  DatabaseType?: string;
  Tags?: string[];
  Source: string;
}

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
      orgs: this.http.get<OrganizationListDto[]>(this.orgsUrl),
      teams: this.http.get<TeamListDto[]>(this.teamsUrl),
      queries: this.http.get<QueryApiDto[]>(this.queriesUrl),
      repos: this.http.get<GitRepositoryListDto[]>(this.reposUrl)
    }).pipe(
      map(({ orgs, teams, queries, repos }) => ({
        stats: {
          organizations: orgs.length,
          teams: teams.length,
          queries: queries.length,
          repositories: repos.length
        },
        recentActivity: [],
        recentQueries: queries.slice(0, 3).map(q => ({
          id: String(q.Id),
          name: q.Name,
          description: q.Description,
          content: q.SqlQuery,
          authorId: q.CreatedBy,
          tags: q.Tags ?? [],
          createdAt: new Date(q.CreatedAt),
          updatedAt: new Date(q.UpdatedAt)
        } as Query)),
        notifications: []
      }))
    );
  }
}