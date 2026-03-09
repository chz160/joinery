import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TeamService } from './team.service';
import { environment } from '../../../environments/environment';

// Mirror the backend response shapes used for flushing HTTP mocks
interface TeamListApiDto {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: number; username: string; email: string; };
  organization: { id: number; name: string; };
  memberCount: number;
  userRole: number | null;
}

interface TeamDetailApiDto {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: number; username: string; email: string; };
  organization: { id: number; name: string; };
  members: {
    id: number;
    role: number;
    permissions?: number;
    effectivePermissions?: number;
    joinedAt: string;
    user: { id: number; username: string; email: string; fullName: string | null; };
  }[];
  userRole: number;
}

describe('TeamService', () => {
  let service: TeamService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiBaseUrl}/teams`;

  const listDto: TeamListApiDto = {
    id: 1,
    name: 'Backend Engineering',
    description: 'API development',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    createdBy: { id: 42, username: 'admin', email: 'admin@example.com' },
    organization: { id: 10, name: 'Acme Corp' },
    memberCount: 3,
    userRole: 1
  };

  const detailDto: TeamDetailApiDto = {
    id: 1,
    name: 'Backend Engineering',
    description: 'API development',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    createdBy: { id: 42, username: 'admin', email: 'admin@example.com' },
    organization: { id: 10, name: 'Acme Corp' },
    members: [
      {
        id: 1,
        role: 1,
        effectivePermissions: 31,
        joinedAt: '2024-01-15T00:00:00Z',
        user: { id: 42, username: 'admin', email: 'admin@example.com', fullName: 'Admin User' }
      }
    ],
    userRole: 1
  };

  // Mirrors the actual POST /api/teams response: members omit permissions/effectivePermissions
  const createTeamResponseDto = {
    id: 1,
    name: 'Backend Engineering',
    description: 'API development',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    createdBy: { id: 42, username: 'admin', email: 'admin@example.com' },
    organization: { id: 10, name: 'Acme Corp' },
    members: [
      {
        id: 1,
        role: 1,
        joinedAt: '2024-01-15T00:00:00Z',
        user: { id: 42, username: 'admin', email: 'admin@example.com', fullName: 'Admin User' }
      }
    ],
    userRole: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TeamService]
    });
    service = TestBed.inject(TeamService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch teams from the API and map to UI model', () => {
    service.getTeams().subscribe(teams => {
      expect(teams.length).toBe(1);
      const team = teams[0];
      expect(team.id).toBe('1');
      expect(team.name).toBe('Backend Engineering');
      expect(team.description).toBe('API development');
      expect(team.organizationId).toBe('10');
      expect(team.memberCount).toBe(3);
      expect(team.members).toEqual([]);
      expect(team.repositories).toEqual([]);
      expect(team.createdAt).toEqual(new Date('2024-01-15T00:00:00Z'));
      expect(team.updatedAt).toEqual(new Date('2024-02-01T00:00:00Z'));
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush([listDto]);
  });

  it('should fetch teams by organization from the API', () => {
    service.getTeamsByOrganization('10').subscribe(teams => {
      expect(teams.length).toBe(1);
      expect(teams[0].id).toBe('1');
    });

    const req = httpMock.expectOne(`${apiUrl}/organization/10`);
    expect(req.request.method).toBe('GET');
    req.flush([listDto]);
  });

  it('should fetch a specific team by ID and map members', () => {
    service.getTeam('1').subscribe(team => {
      expect(team.id).toBe('1');
      expect(team.name).toBe('Backend Engineering');
      expect(team.organizationId).toBe('10');
      expect(team.members.length).toBe(1);
      expect(team.members[0].id).toBe('42');
      expect(team.members[0].name).toBe('Admin User');
      expect(team.members[0].email).toBe('admin@example.com');
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(detailDto);
  });

  it('should use username when fullName is null', () => {
    const dtoWithNullFullName: TeamDetailApiDto = {
      ...detailDto,
      members: [
        {
          ...detailDto.members[0],
          user: { ...detailDto.members[0].user, fullName: null }
        }
      ]
    };

    service.getTeam('1').subscribe(team => {
      expect(team.members[0].name).toBe('admin');
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(dtoWithNullFullName);
  });

  it('should create a team and return mapped result', () => {
    const request = { name: 'New Team', description: 'A new team', organizationId: 10 };

    service.createTeam(request).subscribe(team => {
      expect(team.id).toBe('1');
      expect(team.name).toBe('Backend Engineering');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(createTeamResponseDto);
  });

  it('should update a team and return mapped result', () => {
    const request = { name: 'Updated Team', organizationId: 10 };

    service.updateTeam('1', request).subscribe(team => {
      expect(team.id).toBe('1');
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush(detailDto);
  });

  it('should delete a team', () => {
    service.deleteTeam('1').subscribe(result => {
      expect(result).toBeFalsy();
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should add a team member', () => {
    const request = { userId: 7, role: 0 };

    service.addTeamMember('1', request).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/1/members`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('should remove a team member', () => {
    service.removeTeamMember('1', '7').subscribe(result => {
      expect(result).toBeFalsy();
    });

    const req = httpMock.expectOne(`${apiUrl}/1/members/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should update a member role', () => {
    const request = { role: 1 };

    service.updateMemberRole('1', '7', request).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/1/members/7/role`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('should update member permissions', () => {
    const request = { permissions: 7 };

    service.updateMemberPermissions('1', '7', request).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/1/members/7/permissions`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('should fetch team members with role mapping', () => {
    service.getTeamMembers('1').subscribe(members => {
      expect(members.length).toBe(1);
      const member = members[0];
      expect(member.userId).toBe('42');
      expect(member.name).toBe('Admin User');
      expect(member.email).toBe('admin@example.com');
      expect(member.role).toBe('admin');
      expect(member.status).toBe('active');
      expect(member.effectivePermissions).toBe(31);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(detailDto);
  });

  it('mapRoleFromApi should map numeric roles to string roles', () => {
    expect(TeamService.mapRoleFromApi(2)).toBe('owner');
    expect(TeamService.mapRoleFromApi(1)).toBe('admin');
    expect(TeamService.mapRoleFromApi(0)).toBe('member');
    expect(TeamService.mapRoleFromApi(-1)).toBe('viewer');
    expect(TeamService.mapRoleFromApi(99)).toBe('viewer');
  });

  it('mapRoleToApi should map string roles to numeric values', () => {
    expect(TeamService.mapRoleToApi('owner')).toBe(2);
    expect(TeamService.mapRoleToApi('admin')).toBe(1);
    expect(TeamService.mapRoleToApi('member')).toBe(0);
    expect(TeamService.mapRoleToApi('viewer')).toBe(-1);
  });
});
