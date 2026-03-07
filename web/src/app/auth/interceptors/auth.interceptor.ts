import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<any>(null);

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add auth header if token exists and request is to our API
    const authReq = this.addAuthHeader(req);

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && this.isApiRequest(req.url)) {
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
    // Check if the request is to our API
    return url.includes('/api/') || url.startsWith('http://localhost:3000/api') || url.startsWith('https://api.joinery.com');
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        // Try to refresh token - we need to add this method to Auth service
        console.warn('Token expired, attempting refresh - manual refresh method needed in Auth service');
        this.isRefreshing = false;
        this.auth.logout();
        this.router.navigate(['/auth/login']);
        return throwError(() => new Error('Token refresh not implemented yet'));
      } else {
        // No refresh token, redirect to login
        this.isRefreshing = false;
        this.auth.logout();
        this.router.navigate(['/auth/login']);
        return throwError(() => new Error('No refresh token available'));
      }
    } else {
      // Token refresh in progress, wait for it to complete
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(() => next.handle(this.addAuthHeader(request)))
      );
    }
  }
}