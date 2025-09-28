import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { OrganizationSetupWizard } from './organization-setup-wizard';
import { OrganizationService } from '../../../shared/services/organization.service';
import { RepositoryService } from '../../../shared/services/repository.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Organization, OrganizationSetupWizardData } from '../../../shared/models';

describe('OrganizationSetupWizard', () => {
  let component: OrganizationSetupWizard;
  let fixture: ComponentFixture<OrganizationSetupWizard>;
  let mockOrganizationService: jasmine.SpyObj<OrganizationService>;
  let mockRepositoryService: jasmine.SpyObj<RepositoryService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockWizardData: OrganizationSetupWizardData = {
    organization: {
      name: 'Test Organization',
      description: 'Test Description',
      authProvider: { type: 'github', config: { clientId: 'test' } }
    },
    repositories: [],
    teamMembers: [],
    settings: {
      defaultQueryVisibility: 'team',
      allowRepositoryIntegration: true,
      requireApprovalForQueries: false,
      enableAuditLogging: true
    },
    currentStep: 1,
    completed: false
  };

  beforeEach(async () => {
    const organizationServiceSpy = jasmine.createSpyObj('OrganizationService', [
      'initializeWizardData',
      'updateWizardData',
      'getWizardData',
      'completeWizard',
      'clearWizardData'
    ]);

    const repositoryServiceSpy = jasmine.createSpyObj('RepositoryService', [
      'getGitHubRepositories'
    ]);

    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'showSuccess',
      'showError'
    ]);

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [OrganizationSetupWizard],
      providers: [
        { provide: OrganizationService, useValue: organizationServiceSpy },
        { provide: RepositoryService, useValue: repositoryServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationSetupWizard);
    component = fixture.componentInstance;
    mockOrganizationService = TestBed.inject(OrganizationService) as jasmine.SpyObj<OrganizationService>;
    mockRepositoryService = TestBed.inject(RepositoryService) as jasmine.SpyObj<RepositoryService>;
    mockNotificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup mock return values
    mockOrganizationService.initializeWizardData.and.returnValue(mockWizardData);
    mockOrganizationService.wizardData$ = new BehaviorSubject<OrganizationSetupWizardData | null>(mockWizardData);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize wizard data on ngOnInit', () => {
    component.ngOnInit();
    
    expect(mockOrganizationService.initializeWizardData).toHaveBeenCalled();
    expect(component.wizardData).toEqual(mockWizardData);
  });

  it('should navigate to next step when current step is valid', () => {
    component.ngOnInit();
    component.currentStep = 1;
    spyOn(component, 'isCurrentStepValid').and.returnValue(true);
    
    component.nextStep();
    
    expect(component.currentStep).toBe(2);
    expect(mockOrganizationService.updateWizardData).toHaveBeenCalledWith({ currentStep: 2 });
  });

  it('should not navigate to next step when current step is invalid', () => {
    component.ngOnInit();
    component.currentStep = 1;
    spyOn(component, 'isCurrentStepValid').and.returnValue(false);
    
    component.nextStep();
    
    expect(component.currentStep).toBe(1);
  });

  it('should navigate to previous step', () => {
    component.ngOnInit();
    component.currentStep = 2;
    
    component.previousStep();
    
    expect(component.currentStep).toBe(1);
    expect(mockOrganizationService.updateWizardData).toHaveBeenCalledWith({ currentStep: 1 });
  });

  it('should not navigate to previous step from first step', () => {
    component.ngOnInit();
    component.currentStep = 1;
    
    component.previousStep();
    
    expect(component.currentStep).toBe(1);
  });

  it('should complete wizard successfully', () => {
    const mockOrganization: Organization = {
      id: '123',
      name: 'Test Organization',
      description: 'Test Description',
      ownerId: 'user1',
      members: [],
      authProvider: { type: 'github', config: { clientId: 'test' } },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    component.ngOnInit();
    component.currentStep = 5;
    spyOn(component, 'canCompleteWizard').and.returnValue(true);
    mockOrganizationService.completeWizard.and.returnValue(of(mockOrganization));
    mockOrganizationService.getWizardData.and.returnValue(mockWizardData);
    
    component.completeWizard();
    
    expect(component.isLoading).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/organizations/setup/success'], {
      queryParams: {
        name: mockOrganization.name,
        id: mockOrganization.id,
        invitations: 0,
        repositories: 0
      }
    });
  });

  it('should handle wizard completion error', () => {
    component.ngOnInit();
    spyOn(component, 'canCompleteWizard').and.returnValue(true);
    mockOrganizationService.completeWizard.and.returnValue(
      of(null).pipe(() => { throw new Error('Test error'); })
    );
    
    component.completeWizard();
    
    expect(component.isLoading).toBeFalse();
    expect(mockNotificationService.showError).toHaveBeenCalledWith(
      'Failed to create organization. Please try again.'
    );
  });

  it('should skip optional steps', () => {
    component.ngOnInit();
    component.currentStep = 2; // Repository step (optional)
    spyOn(component, 'isCurrentStepOptional').and.returnValue(true);
    spyOn(component, 'nextStep');
    
    component.skipStep();
    
    expect(component.nextStep).toHaveBeenCalled();
  });

  it('should update step data correctly', () => {
    component.ngOnInit();
    component.currentStep = 1;
    const stepData = { name: 'Updated Organization Name' };
    
    component.onStepDataUpdate(stepData);
    
    expect(mockOrganizationService.updateWizardData).toHaveBeenCalledWith({
      organization: { ...mockWizardData.organization, ...stepData }
    });
  });

  it('should validate step completion correctly', () => {
    component.ngOnInit();
    
    // Test step 1 validation (organization details)
    component.wizardData!.organization.name = 'Valid Name';
    component.wizardData!.organization.authProvider = { type: 'github', config: { clientId: 'test' } };
    component['updateStepValidation']();
    expect(component.steps[0].valid).toBeTrue();
    
    // Test step 1 validation with missing name
    component.wizardData!.organization.name = '';
    component['updateStepValidation']();
    expect(component.steps[0].valid).toBeFalse();
  });

  it('should handle cancel wizard with confirmation', () => {
    component.ngOnInit();
    spyOn(window, 'confirm').and.returnValue(true);
    
    component.cancelWizard();
    
    expect(mockOrganizationService.clearWizardData).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should not cancel wizard without confirmation', () => {
    component.ngOnInit();
    spyOn(window, 'confirm').and.returnValue(false);
    
    component.cancelWizard();
    
    expect(mockOrganizationService.clearWizardData).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});