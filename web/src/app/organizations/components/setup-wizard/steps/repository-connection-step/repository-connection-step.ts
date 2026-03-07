import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedMaterialModule } from '../../../../../shared/modules/material.module';
import { RepositoryService } from '../../../../../shared/services/repository.service';
import { GitHubRepository } from '../../../../../shared/models';

/**
 * Repository Connection Step - Second step of the setup wizard.
 * Allows users to connect GitHub repositories to their organization.
 */
@Component({
  selector: 'app-repository-connection-step',
  imports: [
    CommonModule,
    SharedMaterialModule
  ],
  templateUrl: './repository-connection-step.html',
  styleUrl: './repository-connection-step.scss'
})
export class RepositoryConnectionStepComponent implements OnInit {
  @Input() data: GitHubRepository[] = [];
  @Output() dataChanged = new EventEmitter<GitHubRepository[]>();

  repositories: GitHubRepository[] = [];
  isLoading = false;
  selectedCount = 0;

  constructor(private repositoryService: RepositoryService) {}

  ngOnInit(): void {
    this.loadRepositories();
    this.updateSelectedCount();
  }

  private loadRepositories(): void {
    this.isLoading = true;
    
    this.repositoryService.getGitHubRepositories().subscribe({
      next: (repos) => {
        this.repositories = repos.map(repo => ({
          ...repo,
          selected: this.data.some(dataRepo => dataRepo.id === repo.id)
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading repositories:', error);
        this.isLoading = false;
      }
    });
  }

  toggleRepository(repo: GitHubRepository): void {
    repo.selected = !repo.selected;
    this.updateSelectedCount();
    this.emitDataChange();
  }

  selectAll(): void {
    this.repositories.forEach(repo => repo.selected = true);
    this.updateSelectedCount();
    this.emitDataChange();
  }

  selectNone(): void {
    this.repositories.forEach(repo => repo.selected = false);
    this.updateSelectedCount();
    this.emitDataChange();
  }

  private updateSelectedCount(): void {
    this.selectedCount = this.repositories.filter(repo => repo.selected).length;
  }

  private emitDataChange(): void {
    const selectedRepos = this.repositories.filter(repo => repo.selected);
    this.dataChanged.emit(selectedRepos);
  }
}