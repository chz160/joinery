import { Injectable } from '@angular/core';

/**
 * Provider display information interface
 */
export interface ProviderInfo {
  icon: string;
  name: string;
  color?: string;
}

/**
 * Service to provide consistent provider information across the application.
 * Eliminates duplication of provider switch statements and makes adding new providers trivial.
 * 
 * Follows Open/Closed Principle - adding new providers requires no changes to existing code.
 */
@Injectable({
  providedIn: 'root'
})
export class ProviderService {

  /**
   * Authentication provider configurations
   */
  private readonly authProviders: Record<string, ProviderInfo> = {
    'microsoft': {
      icon: 'business',
      name: 'Microsoft Entra ID',
      color: '#0078d4'
    },
    'github': {
      icon: 'code',
      name: 'GitHub',
      color: '#24292e'
    },
    'aws-iam': {
      icon: 'cloud',
      name: 'AWS IAM',
      color: '#ff9900'
    }
  };

  /**
   * Repository provider configurations  
   */
  private readonly repositoryProviders: Record<string, ProviderInfo> = {
    'github': {
      icon: 'code',
      name: 'GitHub',
      color: '#24292e'
    },
    'gitlab': {
      icon: 'merge_type',
      name: 'GitLab',
      color: '#fc6d26'
    },
    'bitbucket': {
      icon: 'account_tree',
      name: 'Bitbucket',
      color: '#0052cc'
    },
    'azure-devops': {
      icon: 'cloud',
      name: 'Azure DevOps',
      color: '#0078d4'
    }
  };

  /**
   * Default fallback for unknown providers
   */
  private readonly defaultProvider: ProviderInfo = {
    icon: 'security',
    name: 'Unknown',
    color: '#666666'
  };

  /**
   * Get authentication provider information
   * @param type Provider type
   * @returns Provider display information
   */
  getAuthProviderInfo(type: string): ProviderInfo {
    return this.authProviders[type] || this.defaultProvider;
  }

  /**
   * Get authentication provider icon
   * @param type Provider type
   * @returns Material icon name
   */
  getAuthProviderIcon(type: string): string {
    return this.getAuthProviderInfo(type).icon;
  }

  /**
   * Get authentication provider display name
   * @param type Provider type
   * @returns Human-readable provider name
   */
  getAuthProviderName(type: string): string {
    return this.getAuthProviderInfo(type).name;
  }

  /**
   * Get repository provider information
   * @param provider Provider type
   * @returns Provider display information
   */
  getRepositoryProviderInfo(provider: string): ProviderInfo {
    return this.repositoryProviders[provider] || this.defaultProvider;
  }

  /**
   * Get repository provider icon
   * @param provider Provider type
   * @returns Material icon name
   */
  getRepositoryProviderIcon(provider: string): string {
    return this.getRepositoryProviderInfo(provider).icon;
  }

  /**
   * Get repository provider display name
   * @param provider Provider type
   * @returns Human-readable provider name
   */
  getRepositoryProviderName(provider: string): string {
    return this.getRepositoryProviderInfo(provider).name;
  }

  /**
   * Get all supported authentication providers
   * @returns Array of supported auth provider types
   */
  getSupportedAuthProviders(): string[] {
    return Object.keys(this.authProviders);
  }

  /**
   * Get all supported repository providers
   * @returns Array of supported repository provider types
   */
  getSupportedRepositoryProviders(): string[] {
    return Object.keys(this.repositoryProviders);
  }
}