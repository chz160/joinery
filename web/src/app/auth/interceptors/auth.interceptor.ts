import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, from } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add auth header if token exists and request is to our API
    const authReq = this.addAuthHeader(req);

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && this.isApiRequest(req.url) && !this.isAuthManagementEndpoint(req.url)) {
          return this.handle401Error(authReq, next);
        }

        // Handle other error types
        switch (error.status) {
          case 403:
            console.warn('Access denied - insufficient permissions');
            break;
          case 500:
            console.error('Server error occurred');
            break;
          default:
            console.error('HTTP error occurred:', error);
        }

        return throwError(() => error);
      })
    );
  }

  private addAuthHeader(request: HttpRequest<any>): HttpRequest<any> {
    const token = this.auth.getToken();
    
    if (token && this.isApiRequest(request.url)) {
      return request.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`
        }
      });
    }
    
    return request;
  }

  private isApiRequest(url: string): boolean {
    return url.includes('/api/');
  }

  /** Prevent refresh loops on auth management endpoints */
  private isAuthManagementEndpoint(url: string): boolean {
    return url.includes('/auth/logout') || url.includes('/auth/refresh');
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return from(this.auth.refreshTokenManually()).pipe(
        switchMap((newToken) => {
          this.isRefreshing = false;
          if (newToken) {
            this.refreshTokenSubject.next(newToken);
            return next.handle(this.addAuthHeader(request));
          } else {
            const refreshError = new Error('Token refresh failed');
            // Propagate failure to any queued requests and reset subject for future attempts
            this.refreshTokenSubject.error(refreshError);
            this.refreshTokenSubject = new BehaviorSubject<string | null>(null);
            this.performLocalLogout();
            return throwError(() => refreshError);
          }
        }),
        catchError((error) => {
          this.isRefreshing = false;
          // Propagate error to queued requests and reset subject for future attempts
          this.refreshTokenSubject.error(error);
          this.refreshTokenSubject = new BehaviorSubject<string | null>(null);
          this.performLocalLogout();
          return throwError(() => error);
        })
      );
    } else {
      // Token refresh in progress — queue request until new token is available
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(() => next.handle(this.addAuthHeader(request)))
      );
    }
  }

  private performLocalLogout(): void {
    this.auth.logout().catch((error) => {
      console.warn('Backend logout failed during token refresh error handling:', error);
    });
    this.router.navigate(['/auth/login']);
  }
}