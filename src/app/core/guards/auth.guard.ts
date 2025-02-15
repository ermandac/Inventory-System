import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('[AuthGuard] Checking authentication');
  console.log('[AuthGuard] Requested route:', state.url);

  if (authService.isAuthenticated()) {
    console.log('[AuthGuard] User is authenticated');
    return true;
  }

  console.log('[AuthGuard] User is not authenticated, redirecting to login');
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
