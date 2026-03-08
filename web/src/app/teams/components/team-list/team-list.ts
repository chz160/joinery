import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedMaterialModule } from '../../../shared/modules/material.module';
import { ProviderService } from '../../../shared/services/provider.service';
import { TeamService } from '../../../shared/services/team.service';
import { Team } from '../../../shared/models';

@Component({
  selector: 'app-team-list',
  imports: [
    CommonModule,
    SharedMaterialModule
  ],
  templateUrl: './team-list.html',
  styleUrl: './team-list.scss'
})
export class TeamList implements OnInit {
  teams: Team[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private providerService: ProviderService,
    private teamService: TeamService
  ) {}

  ngOnInit(): void {
    this.loadTeams();
  }

  loadTeams(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.teamService.getTeams().subscribe({
      next: (teams) => {
        this.teams = teams;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load teams', err);
        this.errorMessage = 'Failed to load teams. Please try again.';
        this.isLoading = false;
      }
    });
  }

  getProviderIcon(provider: string): string {
    return this.providerService.getRepositoryProviderIcon(provider);
  }
}

