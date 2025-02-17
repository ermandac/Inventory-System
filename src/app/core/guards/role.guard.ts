import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthorizationService } from '../services/authorization.service';
import { map, take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Role, RoleName } from '../models/role.model';

// Helper function to normalize role names
function normalizeRoleName(roleName: string): string {
  return roleName.toLowerCase().replace(/\s+/g, '_');
}

export const roleGuard = (allowedRoles: RoleName[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthorizationService);
    const router = inject(Router);

    console.log('[RoleGuard] Allowed roles:', allowedRoles);

    // First, try to get the role synchronously
    const currentRole = authService.getCurrentUserRole();
    
    console.log('[RoleGuard] Current user role from direct method:', currentRole);

    // If role is directly available, perform synchronous check
    if (currentRole) {
      const normalizedUserRole = normalizeRoleName(currentRole.name);
      const normalizedAllowedRoles = allowedRoles.map(normalizeRoleName);
      
      console.log('[RoleGuard] Normalized user role:', normalizedUserRole);
      console.log('[RoleGuard] Normalized allowed roles:', normalizedAllowedRoles);

      const hasPermission = normalizedAllowedRoles.includes(normalizedUserRole);
      
      console.log('[RoleGuard] Has permission:', hasPermission);

      if (hasPermission) {
        return true;
      }

      // Redirect to unauthorized if no permission
      router.navigate(['/unauthorized'], {
        queryParams: {
          reason: 'insufficient_permissions',
          requiredRoles: allowedRoles.join(', '),
          userRole: currentRole.name
        }
      });
      return false;
    }

    // Fallback to observable method if direct role is not available
    return authService.currentUserRole$.pipe(
      take(1),
      map((role: Role | null) => {
        if (!role) {
          console.error('[RoleGuard] No role found in observable, access denied');
          router.navigate(['/unauthorized'], {
            queryParams: { 
              reason: 'no_role_assigned' 
            }
          });
          return false;
        }
        
        // Normalize the current user's role name
        const normalizedUserRole = normalizeRoleName(role.name);
        console.log('[RoleGuard] Current user role:', role.name);
        console.log('[RoleGuard] Normalized user role:', normalizedUserRole);
        
        // Normalize the allowed roles
        const normalizedAllowedRoles = allowedRoles.map(normalizeRoleName);
        console.log('[RoleGuard] Normalized allowed roles:', normalizedAllowedRoles);

        const hasPermission = normalizedAllowedRoles.includes(normalizedUserRole);
        console.log('[RoleGuard] Has permission:', hasPermission);

        if (!hasPermission) {
          console.error('Access denied. Required roles:', allowedRoles, 'Normalized required roles:', normalizedAllowedRoles, 'User role:', role, 'Normalized user role:', normalizedUserRole);
          router.navigate(['/unauthorized'], {
            queryParams: {
              reason: 'insufficient_permissions',
              requiredRoles: allowedRoles.join(', '),
              userRole: role.name
            }
          });
          return false;
        }

        return true;
      }),
      catchError(error => {
        console.error('[RoleGuard] Error checking role:', error);
        router.navigate(['/unauthorized'], {
          queryParams: { 
            reason: 'role_check_error' 
          }
        });
        return of(false);
      })
    );
  };
};
