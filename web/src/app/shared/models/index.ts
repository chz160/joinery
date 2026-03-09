export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  owner?: User;
  members: User[];
  authProvider?: AuthProvider;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  organization?: Organization;
  memberCount?: number;
  members: User[];
  repositories: Repository[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Repository {
  id: string;
  name: string;
  url: string;
  provider: 'github' | 'gitlab' | 'bitbucket' | 'azure-devops';
  organizationId?: string;
  teamId?: string;
  queries: Query[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Query {
  id: string;
  name: string;
  description?: string;
  content: string;
  folderId?: string;
  repositoryId?: string;
  authorId: string;
  author?: User;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  organizationId?: string;
  teamId?: string;
  queries: Query[];
  subfolders: Folder[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthProvider {
  type: 'microsoft' | 'github' | 'aws-iam';
  config: {
    clientId: string;
    domain?: string;
    [key: string]: any;
  };
}

export interface DashboardPreview {
  stats: {
    organizations: number;
    teams: number;
    queries: number;
    repositories: number;
  };
  recentActivity: ActivityItem[];
  recentQueries: Query[];
  notifications: Notification[];
}

export interface ActivityItem {
  id: string;
  action: string;
  item: string;
  time: string;
  icon?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// Team Member Management interfaces
export type TeamMemberRole = 'owner' | 'admin' | 'member' | 'viewer';
export type TeamMemberStatus = 'active' | 'pending' | 'inactive';

export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  avatar?: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  permissions?: number;
  effectivePermissions?: number;
  joinedAt: Date;
}

// Team Dashboard interfaces
export type TeamDashboardTimeRange = '7d' | '30d' | '90d';

export interface TopQuery {
  id: string;
  name: string;
  runs: number;
  lastRunAt: Date;
}

export interface MemberContribution {
  userId: string;
  userName: string;
  queriesCreated: number;
  queryRuns: number;
}

export interface TeamMetrics {
  totalQueries: number;
  activeMembers: number;
  queryRuns: number;
  avgExecutionTimeMs: number;
  topQueries: TopQuery[];
  memberContributions: MemberContribution[];
}

export interface TeamActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  targetType: 'query' | 'repository' | 'member' | 'team';
  targetName: string;
  timestamp: Date;
}

export interface TeamUsageStat {
  date: string;
  queryRuns: number;
  dataSource: string;
}

// Organization Setup Wizard interfaces
export interface OrganizationSetupWizardData {
  organization: Partial<Organization>;
  repositories: GitHubRepository[];
  teamMembers: TeamInvitation[];
  settings: OrganizationSettings;
  currentStep: number;
  completed: boolean;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  selected?: boolean;
}

export interface TeamInvitation {
  email: string;
  role: 'admin' | 'member' | 'viewer';
  name?: string;
}

export interface OrganizationSettings {
  defaultQueryVisibility: 'private' | 'team' | 'organization';
  allowRepositoryIntegration: boolean;
  requireApprovalForQueries: boolean;
  enableAuditLogging: boolean;
}

export interface WizardStep {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  valid: boolean;
}