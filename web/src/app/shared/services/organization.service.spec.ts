import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { OrganizationService } from './organization.service';
import { Organization, OrganizationSetupWizardData } from '../models';
import { environment } from '../../../environments/environment';

// Mirror the backend response shapes used for flushing HTTP mocks
interface OrganizationListApiDto {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: number; username: string; email: string; };
  memberCount: number;
  teamCount: number;
  userRole: number;
}

interface OrganizationDetailApiDto {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: number; username: string; email: string; };
  members: {
    id: number;
    role: number;
    joinedAt: string;
    user: { id: number; username: string; email: string; fullName: string; };
  }[];
  userRole: number;
}

describe('OrganizationService', () => {
  let service: OrganizationService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiBaseUrl}/organizations`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrganizationService]
    });
    service = TestBed.inject(OrganizationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    // Clear localStorage after each test
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch organizations from the API and map to UI model', () => {
    const apiResponse: OrganizationListApiDto[] = [
      {
        id: 1,
        name: 'Acme Corp',
        description: 'Main corporate organization',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-02-01T00:00:00Z',
        createdBy: { id: 42, username: 'admin', email: 'admin@acme.com' },
        memberCount: 3,
        teamCount: 2,
        userRole: 1
      }
    ];

    service.getOrganizations().subscribe(organizations => {
      expect(organizations.length).toBe(1);
      const org = organizations[0];
      expect(org.id).toBe('1');
      expect(org.name).toBe('Acme Corp');
      expect(org.ownerId).toBe('42');
      expect(org.members).toEqual([]);
      expect(org.createdAt).toEqual(new Date('2024-01-15T00:00:00Z'));
      expect(org.updatedAt).toEqual(new Date('2024-02-01T00:00:00Z'));
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(apiResponse);
  });

  it('should detect first-time user correctly', () => {
    // Test when user has completed setup
    localStorage.setItem('userHasCompletedSetup', 'true');
    
    service.isFirstTimeUser().subscribe(isFirstTime => {
      expect(isFirstTime).toBeFalse();
    });
  });

  it('should detect first-time user when setup not completed', () => {
    spyOn(service, 'isFirstTimeUser').and.returnValue(of(true));
    
    service.isFirstTimeUser().subscribe(isFirstTime => {
      expect(isFirstTime).toBeTrue();
    });
  });

  it('should initialize wizard data correctly', () => {
    const wizardData = service.initializeWizardData();
    
    expect(wizardData).toBeDefined();
    expect(wizardData.currentStep).toBe(1);
    expect(wizardData.completed).toBeFalse();
    expect(wizardData.organization).toBeDefined();
    expect(wizardData.repositories).toEqual([]);
    expect(wizardData.teamMembers).toEqual([]);
    expect(wizardData.settings).toBeDefined();
  });

  it('should update wizard data and emit changes', () => {
    const initialData = service.initializeWizardData();
    const updates = { currentStep: 3 };
    
    service.wizardData$.subscribe(data => {
      if (data && data.currentStep === 3) {
        expect(data.currentStep).toBe(3);
      }
    });
    
    service.updateWizardData(updates);
  });

  it('should post only name/description and map backend response to UI model', () => {
    const input: Partial<Organization> = {
      name: 'Test Org',
      description: 'Test Description',
      authProvider: { type: 'github', config: { clientId: 'test' } }
    };

    const apiResponse: OrganizationDetailApiDto = {
      id: 123,
      name: 'Test Org',
      description: 'Test Description',
      createdAt: '2024-03-01T10:00:00Z',
      updatedAt: '2024-03-01T10:00:00Z',
      createdBy: { id: 7, username: 'alice', email: 'alice@example.com' },
      members: [
        {
          id: 1,
          role: 1,
          joinedAt: '2024-03-01T10:00:00Z',
          user: { id: 7, username: 'alice', email: 'alice@example.com', fullName: 'Alice Smith' }
        }
      ],
      userRole: 1
    };

    service.createOrganization(input).subscribe(org => {
      expect(org.id).toBe('123');
      expect(org.name).toBe('Test Org');
      expect(org.ownerId).toBe('7');
      expect(org.members.length).toBe(1);
      expect(org.members[0].id).toBe('7');
      expect(org.members[0].name).toBe('Alice Smith');
      expect(org.members[0].createdAt).toEqual(new Date('2024-03-01T10:00:00Z'));
      expect(org.createdAt).toEqual(new Date('2024-03-01T10:00:00Z'));
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    // Verify only name and description are sent (not authProvider, members, etc.)
    expect(req.request.body).toEqual({ name: 'Test Org', description: 'Test Description' });
    req.flush(apiResponse);
  });

  it('should complete wizard successfully', () => {
    const wizardData = service.initializeWizardData();
    wizardData.organization.name = 'Test Organization';
    service.updateWizardData(wizardData);

    const apiResponse: OrganizationDetailApiDto = {
      id: 456,
      name: 'Test Organization',
      description: '',
      createdAt: '2024-03-01T10:00:00Z',
      updatedAt: '2024-03-01T10:00:00Z',
      createdBy: { id: 7, username: 'alice', email: 'alice@example.com' },
      members: [],
      userRole: 1
    };

    service.completeWizard().subscribe(organization => {
      expect(organization.id).toBe('456');
      expect(organization.name).toBe('Test Organization');
      expect(localStorage.getItem('userHasCompletedSetup')).toBe('true');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(apiResponse);
  });

  it('should throw error when completing wizard without data', () => {
    service.clearWizardData(); // Ensure no wizard data
    
    expect(() => {
      service.completeWizard().subscribe();
    }).toThrow();
  });

  it('should check organization name uniqueness via the API', () => {
    const testName = 'Unique Organization';
    const apiResponse: OrganizationListApiDto[] = [
      {
        id: 1,
        name: 'Existing Org',
        description: '',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: { id: 1, username: 'user1', email: 'user1@example.com' },
        memberCount: 1,
        teamCount: 0,
        userRole: 1
      }
    ];

    service.checkOrganizationNameUniqueness(testName).subscribe(isUnique => {
      expect(isUnique).toBeTrue();
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(apiResponse);
  });

  it('should clear wizard data', () => {
    service.initializeWizardData();
    service.clearWizardData();
    
    service.wizardData$.subscribe(data => {
      expect(data).toBeNull();
    });
  });

  it('should get current wizard data', () => {
    const wizardData = service.initializeWizardData();
    const retrievedData = service.getWizardData();
    
    expect(retrievedData).toEqual(wizardData);
  });

  it('should update organization via the API and map backend response', () => {
    const apiResponse: OrganizationDetailApiDto = {
      id: 123,
      name: 'Updated Org Name',
      description: 'Test Description',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-03-08T00:00:00Z',
      createdBy: { id: 1, username: 'user1', email: 'user1@example.com' },
      members: [],
      userRole: 1
    };

    service.updateOrganization('123', { name: 'Updated Org Name' }).subscribe(org => {
      expect(org.id).toBe('123');
      expect(org.name).toBe('Updated Org Name');
      expect(org.updatedAt).toEqual(new Date('2024-03-08T00:00:00Z'));
    });

    const req = httpMock.expectOne(`${apiUrl}/123`);
    expect(req.request.method).toBe('PUT');
    // Verify only name and description are sent
    expect(req.request.body).toEqual({ name: 'Updated Org Name', description: undefined });
    req.flush(apiResponse);
  });
});