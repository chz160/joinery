import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { Auth } from '../services/auth';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockAuth: jasmine.SpyObj<Auth>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('Auth', [], { 
      isAuthenticated$: of(false) 
    });
    const routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
    guard = TestBed.inject(AuthGuard);
    mockAuth = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when authenticated', (done) => {
    Object.defineProperty(mockAuth, 'isAuthenticated$', {
      value: of(true),
      writable: true
    });

    guard.canActivate().subscribe(result => {
      expect(result).toBe(true);
      done();
    });
  });

  it('should redirect to login when not authenticated', (done) => {
    const urlTree = {} as any;
    mockRouter.createUrlTree.and.returnValue(urlTree);

    guard.canActivate().subscribe(result => {
      expect(result).toBe(urlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
      done();
    });
  });
});