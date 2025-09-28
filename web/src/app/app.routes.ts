import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./landing/components/landing-page/landing-page').then(m => m.LandingPage)
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/components/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [AuthGuard]
  },
  { 
    path: 'auth/login', 
    loadComponent: () => import('./auth/components/login/login').then(m => m.Login)
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./auth/components/oauth-callback/oauth-callback').then(m => m.OAuthCallback)
  },
  {
    path: 'organizations',
    loadComponent: () => import('./organizations/components/organization-list/organization-list').then(m => m.OrganizationList),
    canActivate: [AuthGuard]
  },
  {
    path: 'organizations/setup',
    loadComponent: () => import('./organizations/components/setup-wizard/organization-setup-wizard').then(m => m.OrganizationSetupWizard),
    canActivate: [AuthGuard]
  },
  {
    path: 'organizations/setup/success',
    loadComponent: () => import('./organizations/components/setup-success/organization-setup-success').then(m => m.OrganizationSetupSuccess)
  },
  {
    path: 'teams',
    loadComponent: () => import('./teams/components/team-list/team-list').then(m => m.TeamList),
    canActivate: [AuthGuard]
  },
  {
    path: 'queries',
    loadComponent: () => import('./queries/components/query-browser/query-browser').then(m => m.QueryBrowser),
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '/dashboard' }
];
