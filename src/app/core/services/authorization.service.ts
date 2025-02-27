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
    if (typeof role === 'string' || typeof role === 'object' && 'name' in role) {
      // If role is a string or RoleName, fetch the full role object
      try {
        const normalizedRoleName = typeof role === 'string' 
          ? this.convertToRoleName(role) 
          : role.name;

        this.roleService.getRoleByName(normalizedRoleName)
          .pipe(
            catchError(error => {
              console.error(`[AuthorizationService] Error fetching role: ${normalizedRoleName}`, error);
              this.clearCurrentUserRole();
              return EMPTY;
            })
          )
          .subscribe(fetchedRole => {
            if (fetchedRole) {
              this.updateRoleInternally(fetchedRole);
            } else {
              console.warn(`[AuthorizationService] No role found for: ${normalizedRoleName}`);
              this.clearCurrentUserRole();
            }
          });
      } catch (error) {
        console.error('[AuthorizationService] Error in role update:', error);
        this.clearCurrentUserRole();
      }
    } else if (role && 'permissions' in role) {
      // If role is a full Role object
      this.updateRoleInternally(role);
    }
  }

  private updateRoleInternally(role: Role): void {
    this.currentUserRoleSubject.next(role);
    
    // Persist role in localStorage
    try {
      localStorage.setItem('userRole', JSON.stringify(role));
    } catch (error) {
      console.error('[AuthorizationService] Failed to store role in localStorage', error);
    }
    
    // Update cache
    this.cachedRole = role;
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

  getCurrentUserRole(): Role | null {
    // Return cached role if available to reduce redundant parsing
    if (this.cachedRole) {
      return this.cachedRole;
    }

    const storedRole = localStorage.getItem('userRole');
    
    if (storedRole) {
      try {
        this.cachedRole = JSON.parse(storedRole);
        return this.cachedRole;
      } catch (error) {
        console.error('[AuthorizationService] Error parsing stored role');
      }
    }

    const currentRole = this.currentUserRoleSubject.getValue();
    this.cachedRole = currentRole;
    
    return currentRole;
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
    this.currentUserRoleSubject.next(null);
    localStorage.removeItem('userRole');
    this.cachedRole = null;
    console.log('[AuthorizationService] Cleared current user role');
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
    return currentRole?.name === 'admin' || 
           currentRole?.name === 'customer' || 
           currentRole?.name === 'inventory_staff';
  }

  canUpdateOrderStatus(): boolean {
    const currentRole = this.getCurrentUserRole();
    return currentRole?.name === 'admin' || 
           currentRole?.name === 'inventory_staff' || 
           currentRole?.name === 'logistics_manager';
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
