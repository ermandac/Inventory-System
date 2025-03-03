import { Injectable, Inject, forwardRef } from '@angular/core';
import { BehaviorSubject, Observable, of, EMPTY } from 'rxjs';
import { map, switchMap, tap, catchError, take } from 'rxjs/operators';
import { 
  Role, 
  PermissionType, 
  ResourceType, 
  RoleName, 
  Permission, 
  DEFAULT_ROLES 
} from '@core/models/role.model';
import { User } from '@core/models/user.model';
import { RoleService } from './role.service';
import { UserService } from './user.service';
import { AuthStateService } from './auth-state.service';

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  private currentUserRoleSubject = new BehaviorSubject<Role | null>(null);
  currentUserRole$ = this.currentUserRoleSubject.asObservable();
  private cachedRole: Role | null = null;

  constructor(
    @Inject(forwardRef(() => RoleService)) private roleService: RoleService,
    @Inject(forwardRef(() => UserService)) private userService: UserService,
    @Inject(forwardRef(() => AuthStateService)) private authStateService: AuthStateService
  ) {
    // Explicitly initialize user role on service creation
    this.initializeUserRole();

    // Listen to role changes from auth state
    this.authStateService.userRole$.subscribe(role => {
      if (role) {
        console.log('[AuthorizationService] Role from auth state:', role);
        this.updateCurrentUserRole(role);
      } else {
        console.log('[AuthorizationService] No role from auth state, clearing');
        this.clearCurrentUserRole();
      }
    });
  }

  private extractCurrentUser(): Observable<User | null> {
    return this.userService.getCurrentUser().pipe(
      switchMap(userSource => {
        // If userSource is already an Observable, flatten it
        if (userSource instanceof Observable) {
          return userSource.pipe(
            take(1),
            map(user => {
              // Ensure the result is a User object or null
              return this.isValidUser(user) ? user : null;
            }),
            catchError(() => of(null))
          );
        }
        
        // If userSource is a User object, validate and return
        if (this.isValidUser(userSource)) {
          return of(userSource);
        }
        
        // If not a valid user, return null
        return of(null);
      }),
      catchError(() => of(null))
    );
  }

  // Helper method to validate User object
  private isValidUser(user: any): user is User {
    return user && 
      typeof user === 'object' && 
      '_id' in user && 
      'username' in user && 
      'email' in user && 
      'role' in user && 
      // Check if role is a valid string
      ['admin', 'customer', 'inventory_staff', 'logistics_manager'].includes(
        String(user.role).toLowerCase()
      );
  }

  private convertToRoleName(role: User['role'] | string | null | undefined): RoleName {
    if (!role) {
      return RoleName.CUSTOMER;
    }
    
    const roleString = typeof role === 'object' 
      ? (role as User['role']).toString() 
      : String(role);
    
    // Normalize role to lowercase and remove uppercase variants
    const normalizedRole = roleString.toLowerCase().replace(/\s+/g, '_');
    
    switch (normalizedRole) {
      case 'admin':
      case 'admin':
        return RoleName.ADMIN;
      case 'inventory_staff':
      case 'inventory staff':
      case 'inventorystaff':
        return RoleName.INVENTORY_STAFF;
      case 'logistics_manager':
      case 'logistics manager':
      case 'logisticsmanager':
        return RoleName.LOGISTICS_MANAGER;
      case 'customer':
      default:
        return RoleName.CUSTOMER;
    }
  }

  private fetchRoleByName(roleName: RoleName): Observable<Role | null> {
    return this.roleService.getRoleByName(roleName).pipe(
      take(1),
      map(role => role || null),
      catchError(error => {
        console.error(`[AuthorizationService] Error fetching role:`, error);
        return of(null);
      })
    );
  }

  private initializeUserRole(): void {
    this.extractCurrentUser().pipe(
      switchMap(currentUser => {
        if (!currentUser) {
          console.log('[AuthorizationService] No current user found');
          return of(null);
        }
        
        console.log('[AuthorizationService] Current user found:', currentUser);
        
        const roleName = this.convertToRoleName(currentUser.role);
        console.log(`[AuthorizationService] Converted role name: ${roleName}`);
        
        return this.fetchRoleByName(roleName);
      }),
      take(1),
      tap(role => {
        if (role) {
          console.log('[AuthorizationService] Role initialized:', role);
          // Explicitly set the role in the BehaviorSubject
          this.updateCurrentUserRole(role);
        } else {
          console.warn('[AuthorizationService] No role found during initialization');
          this.clearCurrentUserRole();
        }
      }),
      catchError(error => {
        console.error('[AuthorizationService] Error initializing role:', error);
        this.clearCurrentUserRole();
        return of(null);
      })
    )
    .subscribe();
  }

  private fetchCurrentUserRole(): Observable<Role | null> {
    return this.extractCurrentUser().pipe(
      switchMap(currentUser => {
        if (!currentUser) {
          return of(null);
        }
        
        const roleName = this.convertToRoleName(currentUser.role);
        return this.fetchRoleByName(roleName);
      })
    );
  }

  private updateCurrentUserRole(role: Role | string | RoleName): void {
    // Synchronous fallback if observable method fails
    try {
      let normalizedRoleName: string;

      // Handle different input types
      if (typeof role === 'string') {
        normalizedRoleName = this.convertToRoleName(role);
      } else if (typeof role === 'object' && 'name' in role) {
        normalizedRoleName = this.convertToRoleName(role.name);
      } else if (typeof role === 'number') {
        // Handle RoleName enum
        normalizedRoleName = this.convertToRoleName(RoleName[role]);
      } else {
        // Default fallback
        console.warn('[AuthorizationService] Unrecognized role type');
        this.clearCurrentUserRole();
        return;
      }

      // Directly fetch role synchronously if possible
      const fetchedRole = this.roleService.getRoleByNameSync(normalizedRoleName);

      if (fetchedRole) {
        this.updateRoleInternally(fetchedRole);
        return;
      }

      // Fallback to observable method
      const roleNameKey = Object.keys(RoleName).find(
        key => RoleName[key as keyof typeof RoleName] === role
      ) as RoleName | undefined;

      if (roleNameKey) {
        this.roleService.getRoleByName(roleNameKey)
          .pipe(
            take(1),
            catchError(error => {
              console.error(`[AuthorizationService] Error fetching role: ${normalizedRoleName}`, error);
              this.clearCurrentUserRole();
              return EMPTY;
            })
          )
          .subscribe(observableRole => {
            if (observableRole) {
              this.updateRoleInternally(observableRole);
            } else {
              console.warn(`[AuthorizationService] No role found for: ${normalizedRoleName}`);
              this.clearCurrentUserRole();
            }
          });
      } else {
        console.warn('[AuthorizationService] Could not convert role to RoleName');
        this.clearCurrentUserRole();
      }

    } catch (error) {
      console.error('[AuthorizationService] Unexpected error in role update:', error);
      this.clearCurrentUserRole();
    }
  }

  getCurrentUserRole(): Role | null {
    // First, check cached role
    if (this.cachedRole) {
      return this.cachedRole;
    }

    // Then check BehaviorSubject
    const currentRole = this.currentUserRoleSubject.getValue();
    if (currentRole) {
      return currentRole;
    }

    // Last resort: try to extract from localStorage or user service
    try {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole) {
        const parsedRole = JSON.parse(storedRole);
        if (parsedRole && parsedRole.name) {
          return parsedRole;
        }
      }
    } catch (error) {
      console.error('[AuthorizationService] Error parsing stored role');
    }

    return null;
  }

  hasPermission(resource: ResourceType, permissionType: PermissionType): Observable<boolean> {
    return this.currentUserRole$.pipe(
      take(1),
      map(role => {
        if (!role) return false;
        
        return role.permissions.some(
          permission => 
            permission.resource === resource && 
            permission.type === permissionType
        );
      }),
      catchError(() => of(false))
    );
  }

  canCreate(resource: ResourceType): Observable<boolean> {
    return this.hasPermission(resource, PermissionType.CREATE);
  }

  canRead(resource: ResourceType): Observable<boolean> {
    return this.hasPermission(resource, PermissionType.READ);
  }

  canUpdate(resource: ResourceType): Observable<boolean> {
    return this.hasPermission(resource, PermissionType.UPDATE);
  }

  canDelete(resource: ResourceType): Observable<boolean> {
    return this.hasPermission(resource, PermissionType.DELETE);
  }

  reloadUserRole(): void {
    this.userService.currentUser$.pipe(
      take(1),
      switchMap(user => {
        if (user && user.role) {
          return this.roleService.getRoleByName(user.role).pipe(
            catchError(error => {
              console.error('[AuthorizationService] Error reloading user role:', error);
              this.clearCurrentUserRole();
              return EMPTY;
            })
          );
        }
        return EMPTY;
      })
    ).subscribe(role => {
      if (role) {
        this.updateCurrentUserRole(role);
      } else {
        this.clearCurrentUserRole();
      }
    });
  }

  private clearCurrentUserRole(): void {
    this.cachedRole = null;
    this.currentUserRoleSubject.next(null);
    localStorage.removeItem('userRole');
    console.log('[AuthorizationService] Cleared current user role');
  }

  private updateRoleInternally(role: Role): void {
    this.cachedRole = role;
    this.currentUserRoleSubject.next(role);
  }

  // Permission check methods
  canViewOrders(): boolean {
    const currentRole = this.getCurrentUserRole();
    return currentRole?.name === 'admin' || 
           currentRole?.name === 'customer' || 
           currentRole?.name === 'inventory_staff' || 
           currentRole?.name === 'logistics_manager';
  }

  canCreateOrders(): boolean {
    const currentRole = this.getCurrentUserRole();
    
    if (!currentRole) {
      console.warn('[AuthorizationService] No current role, denying order creation');
      return false;
    }

    // Allowed roles for order creation
    const allowedRoles = [
      RoleName.ADMIN, 
      RoleName.INVENTORY_STAFF, 
      RoleName.LOGISTICS_MANAGER
    ];

    const normalizedUserRole = this.normalizeRoleName(currentRole.name);
    const normalizedAllowedRoles = allowedRoles.map(role => this.normalizeRoleName(role.toString()));

    const hasPermission = normalizedAllowedRoles.includes(normalizedUserRole);
    
    console.log('[AuthorizationService] Order creation permission:', {
      userRole: currentRole.name,
      hasPermission
    });

    return hasPermission;
  }

  canUpdateOrderStatus(): boolean {
    const currentRole = this.getCurrentUserRole();
    return currentRole?.name === 'admin' || 
           currentRole?.name === 'inventory_staff' || 
           currentRole?.name === 'logistics_manager';
  }

  private normalizeRoleName(roleName: string): string {
    return roleName.toLowerCase().replace(/\s+/g, '_');
  }

  getUserPermissions(): {
    canViewOrders: boolean;
    canCreateOrders: boolean;
    canUpdateOrderStatus: boolean;
  } {
    return {
      canViewOrders: this.canViewOrders(),
      canCreateOrders: this.canCreateOrders(),
      canUpdateOrderStatus: this.canUpdateOrderStatus()
    };
  }
}
