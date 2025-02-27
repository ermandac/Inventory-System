import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { RoleService } from './role.service';
import { AuthStateService } from './auth-state.service';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  role: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private http: HttpClient,
    private router: Router,
    private roleService: RoleService,
    private authStateService: AuthStateService
  ) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      try {
        // Validate token before loading user
        if (this.isAuthenticated()) {
          const user: User = JSON.parse(storedUser);
          this.currentUserSubject.next(user);
          this.authStateService.updateUserRole(user.role);
        } else {
          console.warn('[AuthService] Stored token is invalid or expired');
          this.logout();
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.logout();
      }
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(response => {
        // Store user in local storage
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('token', response.token);

        // Update current user and role
        this.currentUserSubject.next(response.user);
        this.authStateService.updateUserRole(response.user.role);
      })
    );
  }

  logout(): void {
    // Clear local storage
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    // Reset current user and role
    this.currentUserSubject.next(null);
    this.authStateService.clearUserRole();

    // Navigate to login page
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      // Decode JWT to check expiration
      const tokenPayload = this.decodeToken(token);
      
      // Check if token is expired
      if (tokenPayload && tokenPayload.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        const isTokenExpired = tokenPayload.exp < currentTime;
        
        console.log('[AuthService] Token validation:', {
          isTokenValid: !isTokenExpired,
          currentTime,
          tokenExpiration: tokenPayload.exp
        });

        if (isTokenExpired) {
          console.warn('[AuthService] Token has expired');
          this.logout();
          return false;
        }

        return true;
      }

      return true;
    } catch (error) {
      console.error('[AuthService] Token validation error:', error);
      this.logout();
      return false;
    }
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace('-', '+').replace('_', '/');
      return JSON.parse(window.atob(base64));
    } catch (error) {
      console.error('[AuthService] Error decoding token:', error);
      return null;
    }
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh-token`, {}).pipe(
      tap(response => {
        // Update token and user in local storage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        // Update current user and role
        this.currentUserSubject.next(response.user);
        this.authStateService.updateUserRole(response.user.role);
      }),
      catchError(error => {
        console.error('Token refresh failed:', error);
        this.logout();
        return throwError(() => new Error('Token refresh failed'));
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  getCurrentUserSync(): User | null {
    return this.currentUserSubject.getValue();
  }

  getCurrentUserToken(): string | null {
    return localStorage.getItem('token');
  }
}
