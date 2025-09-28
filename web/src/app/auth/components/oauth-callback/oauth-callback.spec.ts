import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { OAuthCallback } from './oauth-callback';
import { Auth } from '../../services/auth';

describe('OAuthCallback', () => {
  let component: OAuthCallback;
  let fixture: ComponentFixture<OAuthCallback>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;
  let mockAuth: jasmine.SpyObj<Auth>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { queryParams: { code: 'test-code', state: 'test-state' } }
    });
    const authSpy = jasmine.createSpyObj('Auth', ['handleOAuthCallback']);

    await TestBed.configureTestingModule({
      imports: [
        OAuthCallback,
        HttpClientTestingModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
        { provide: Auth, useValue: authSpy }
      ]
    }).compileComponents();

    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockActivatedRoute = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;
    mockAuth = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OAuthCallback);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle successful OAuth callback', async () => {
    mockAuth.handleOAuthCallback.and.returnValue(Promise.resolve());

    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockAuth.handleOAuthCallback).toHaveBeenCalledWith('test-code', 'test-state');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should handle OAuth error', async () => {
    mockAuth.handleOAuthCallback.and.returnValue(Promise.reject(new Error('Test error')));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.error).toBe('Test error');
    expect(component.loading).toBeFalse();
  });
});