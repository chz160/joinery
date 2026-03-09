import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { GitHubRepository } from '../models';
import { environment } from '../../../environments/environment';

/**
 * Service for managing repository connections, particularly GitHub integration.
 * Handles fetching repositories from GitHub API and managing connections.
 */
@Injectable({
  providedIn: 'root'
})
export class RepositoryService {
  private readonly githubApiUrl = 'https://api.github.com';
  private readonly apiUrl = `${environment.apiBaseUrl}/gitrepositories`;

  constructor(private http: HttpClient) {}

  /**
   * Fetch user's GitHub repositories
   * Requires GitHub access token to be available
   */
  getGitHubRepositories(accessToken?: string): Observable<GitHubRepository[]> {
    if (!accessToken) {
      return of([]);
    }

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
        return of([]);
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
   * Connect selected repositories to the organization via the server API.
   * Errors from individual POST requests will propagate to the caller.
   */
  connectRepositories(organizationId: number, repositories: GitHubRepository[]): Observable<void> {
    const selected = repositories.filter(repo => repo.selected);
    if (selected.length === 0) {
      return of(void 0);
    }
    return forkJoin(
      selected.map(repo =>
        this.http.post(this.apiUrl, {
          name: repo.name,
          repositoryUrl: repo.clone_url,
          description: repo.description,
          organizationId
        })
      )
    ).pipe(map(() => void 0));
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