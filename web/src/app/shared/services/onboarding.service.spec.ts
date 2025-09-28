import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { OnboardingService } from './onboarding.service';
import { Auth } from '../../auth/services/auth';
import { OrganizationService } from './organization.service';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let mockAuth: jasmine.SpyObj<Auth>;
  let mockOrganizationService: jasmine.SpyObj<OrganizationService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('Auth', [], {
      isAuthenticated$: new BehaviorSubject(false)
    });
    const organizationServiceSpy = jasmine.createSpyObj('OrganizationService', ['isFirstTimeUser']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], { url: '/dashboard' });

    TestBed.configureTestingModule({
      providers: [
        OnboardingService,
        { provide: Auth, useValue: authSpy },
        { provide: OrganizationService, useValue: organizationServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(OnboardingService);
    mockAuth = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
    mockOrganizationService = TestBed.inject(OrganizationService) as jasmine.SpyObj<OrganizationService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false for redirect when user is not authenticated', () => {
    (mockAuth as any).isAuthenticated$ = new BehaviorSubject(false);
    
    service.shouldRedirectToSetup().subscribe(shouldRedirect => {
      expect(shouldRedirect).toBeFalse();
    });
  });

  it('should return true for redirect when user is authenticated and first-time', () => {
    (mockAuth as any).isAuthenticated$ = new BehaviorSubject(true);
    mockOrganizationService.isFirstTimeUser.and.returnValue(of(true));
    
    service.shouldRedirectToSetup().subscribe(shouldRedirect => {
      expect(shouldRedirect).toBeTrue();
    });
  });

  it('should return false for redirect when user is authenticated but not first-time', () => {
    (mockAuth as any).isAuthenticated$ = new BehaviorSubject(true);
    mockOrganizationService.isFirstTimeUser.and.returnValue(of(false));
    
    service.shouldRedirectToSetup().subscribe(shouldRedirect => {
      expect(shouldRedirect).toBeFalse();
    });
  });

  it('should redirect first-time user to setup', () => {
    (mockAuth as any).isAuthenticated$ = new BehaviorSubject(true);
    mockOrganizationService.isFirstTimeUser.and.returnValue(of(true));
    Object.defineProperty(mockRouter, 'url', { value: '/dashboard' });
    
    service.checkAndRedirectFirstTimeUser();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/organizations/setup']);
    expect(localStorage.getItem('postSetupRedirectUrl')).toBe('/dashboard');
  });

  it('should not redirect non-first-time user', () => {
    (mockAuth as any).isAuthenticated$ = new BehaviorSubject(true);
    mockOrganizationService.isFirstTimeUser.and.returnValue(of(false));
    
    service.checkAndRedirectFirstTimeUser();
    
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should handle API error gracefully', () => {
    (mockAuth as any).isAuthenticated$ = new BehaviorSubject(true);
    mockOrganizationService.isFirstTimeUser.and.returnValue(
      of(null).pipe(() => { throw new Error('API Error'); })
    );
    
    service.shouldRedirectToSetup().subscribe(shouldRedirect => {
      expect(shouldRedirect).toBeFalse();
    });
  });

  it('should store and retrieve post-setup redirect URL', () => {
    localStorage.setItem('postSetupRedirectUrl', '/teams');
    
    const redirectUrl = service.getPostSetupRedirectUrl();
    
    expect(redirectUrl).toBe('/teams');
    expect(localStorage.getItem('postSetupRedirectUrl')).toBeNull();
  });

  it('should return default URL when no post-setup URL stored', () => {
    const redirectUrl = service.getPostSetupRedirectUrl();
    
    expect(redirectUrl).toBe('/dashboard');
  });

  it('should mark user as setup complete', () => {
    service.markUserAsSetup();
    
    expect(localStorage.getItem('userHasCompletedSetup')).toBe('true');
  });

  it('should check if user has completed setup', () => {
    localStorage.setItem('userHasCompletedSetup', 'true');
    
    expect(service.hasUserCompletedSetup()).toBeTrue();
    
    localStorage.removeItem('userHasCompletedSetup');
    
    expect(service.hasUserCompletedSetup()).toBeFalse();
  });

  it('should reset setup state', () => {
    localStorage.setItem('userHasCompletedSetup', 'true');
    localStorage.setItem('postSetupRedirectUrl', '/teams');
    
    service.resetSetupState();
    
    expect(localStorage.getItem('userHasCompletedSetup')).toBeNull();
    expect(localStorage.getItem('postSetupRedirectUrl')).toBeNull();
  });

  it('should not store URL for setup page itself', () => {
    (mockAuth as any).isAuthenticated$ = new BehaviorSubject(true);
    mockOrganizationService.isFirstTimeUser.and.returnValue(of(true));
    Object.defineProperty(mockRouter, 'url', { value: '/organizations/setup' });
    
    service.checkAndRedirectFirstTimeUser();
    
    expect(localStorage.getItem('postSetupRedirectUrl')).toBeNull();
  });

  it('should not store URL for home page', () => {
    (mockAuth as any).isAuthenticated$ = new BehaviorSubject(true);
    mockOrganizationService.isFirstTimeUser.and.returnValue(of(true));
    Object.defineProperty(mockRouter, 'url', { value: '/' });
    
    service.checkAndRedirectFirstTimeUser();
    
    expect(localStorage.getItem('postSetupRedirectUrl')).toBeNull();
  });
});