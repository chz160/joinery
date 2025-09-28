import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { GitHubRepository } from '../models';

/**
 * Service for managing repository connections, particularly GitHub integration.
 * Handles fetching repositories from GitHub API and managing connections.
 */
@Injectable({
  providedIn: 'root'
})
export class RepositoryService {
  private readonly githubApiUrl = 'https://api.github.com';

  constructor(private http: HttpClient) {}

  /**
   * Fetch user's GitHub repositories
   * Requires GitHub access token to be available
   */
  getGitHubRepositories(accessToken?: string): Observable<GitHubRepository[]> {
    // Mock data for development when no access token is available
    if (!accessToken) {
      return of([
        {
          id: 1,
          name: 'data-analytics-queries',
          full_name: 'johndoe/data-analytics-queries',
          description: 'Collection of SQL queries for data analysis',
          private: false,
          html_url: 'https://github.com/johndoe/data-analytics-queries',
          clone_url: 'https://github.com/johndoe/data-analytics-queries.git',
          selected: false
        },
        {
          id: 2,
          name: 'team-dashboards',
          full_name: 'johndoe/team-dashboards',
          description: 'Shared dashboard configurations',
          private: true,
          html_url: 'https://github.com/johndoe/team-dashboards',
          clone_url: 'https://github.com/johndoe/team-dashboards.git',
          selected: false
        },
        {
          id: 3,
          name: 'marketing-reports',
          full_name: 'acme-corp/marketing-reports',
          description: 'Marketing analytics and reporting queries',
          private: true,
          html_url: 'https://github.com/acme-corp/marketing-reports',
          clone_url: 'https://github.com/acme-corp/marketing-reports.git',
          selected: false
        }
      ]);
    }

    // Real GitHub API implementation
    const headers = new HttpHeaders({
      'Authorization': `token ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json'
    });

    return this.http.get<any[]>(`${this.githubApiUrl}/user/repos`, { headers }).pipe(
      map(repos => repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        selected: false
      }))),
      catchError(error => {
        console.error('Error fetching GitHub repositories:', error);
        return of([]); // Return empty array on error
      })
    );
  }

  /**
   * Fetch organization's GitHub repositories
   */
  getOrganizationRepositories(org: string, accessToken?: string): Observable<GitHubRepository[]> {
    if (!accessToken) {
      return of([]);
    }

    const headers = new HttpHeaders({
      'Authorization': `token ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json'
    });

    return this.http.get<any[]>(`${this.githubApiUrl}/orgs/${org}/repos`, { headers }).pipe(
      map(repos => repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        selected: false
      }))),
      catchError(error => {
        console.error('Error fetching organization repositories:', error);
        return of([]);
      })
    );
  }

  /**
   * Connect selected repositories to the organization
   */
  connectRepositories(organizationId: string, repositories: GitHubRepository[]): Observable<void> {
    // Mock implementation - replace with actual API call
    console.log('Connecting repositories to organization:', organizationId, repositories);
    return of(void 0);
    
    // TODO: Replace with actual API call
    // return this.http.post<void>(`/api/organizations/${organizationId}/repositories`, {
    //   repositories: repositories.filter(repo => repo.selected)
    // });
  }

  /**
   * Validate repository access
   */
  validateRepositoryAccess(repoUrl: string, accessToken?: string): Observable<boolean> {
    // Mock implementation
    return of(true);
    
    // TODO: Implement actual validation
    // This would check if the user has access to the repository
  }

  /**
   * Search repositories by name
   */
  searchRepositories(query: string, accessToken?: string): Observable<GitHubRepository[]> {
    if (!accessToken || !query.trim()) {
      return of([]);
    }

    const headers = new HttpHeaders({
      'Authorization': `token ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json'
    });

    return this.http.get<any>(`${this.githubApiUrl}/search/repositories?q=${encodeURIComponent(query)}`, { headers }).pipe(
      map(response => response.items.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        selected: false
      }))),
      catchError(error => {
        console.error('Error searching repositories:', error);
        return of([]);
      })
    );
  }
}