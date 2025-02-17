import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, from, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Get the token using the new method
  const token = authService.getCurrentUserToken();

  if (token) {
    // Clone the request and add the authorization header
    const authRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return next(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 (Unauthorized) errors
        if (error.status === 401) {
          console.log('[AuthInterceptor] Token expired or invalid, attempting to refresh');
          
          // Attempt to refresh the token
          return from(authService.refreshToken()).pipe(
            switchMap(refreshResponse => {
              console.log('[AuthInterceptor] Token refreshed successfully');
              
              // Retry the original request with the new token
              const newRequest = request.clone({
                setHeaders: {
                  Authorization: `Bearer ${refreshResponse.token}`
                }
              });
              
              return next(newRequest);
            }),
            catchError(refreshError => {
              console.error('[AuthInterceptor] Token refresh failed', refreshError);
              
              // If refresh fails, logout and redirect to login
              authService.logout();
              router.navigate(['/auth/login'], {
                queryParams: { 
                  reason: 'session_expired' 
                }
              });
              
              return throwError(() => refreshError);
            })
          );
        }
        
        // For other errors, rethrow
        return throwError(() => error);
      })
    );
  }

  // If no token, pass the original request
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.log('[AuthInterceptor] No token or unauthorized');
        authService.logout();
        router.navigate(['/auth/login'], {
          queryParams: { 
            reason: 'no_token' 
          }
        });
      }
      return throwError(() => error);
    })
  );
};
