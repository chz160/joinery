import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/components/dashboard/dashboard').then(m => m.Dashboard)
  },
  { 
    path: 'auth/login', 
    loadComponent: () => import('./auth/components/login/login').then(m => m.Login)
  },
  {
    path: 'organizations',
    loadComponent: () => import('./organizations/components/organization-list/organization-list').then(m => m.OrganizationList)
  },
  {
    path: 'teams',
    loadComponent: () => import('./teams/components/team-list/team-list').then(m => m.TeamList)
  },
  {
    path: 'queries',
    loadComponent: () => import('./queries/components/query-browser/query-browser').then(m => m.QueryBrowser)
  },
  { path: '**', redirectTo: '/dashboard' }
];
