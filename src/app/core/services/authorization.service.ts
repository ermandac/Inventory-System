import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Role, PermissionType, ResourceType, RoleName } from '@core/models/role.model';
import { User } from '@core/models/user.model';
import { RoleService } from './role.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  private currentUserRoleSubject = new BehaviorSubject<Role | null>(null);
  currentUserRole$ = this.currentUserRoleSubject.asObservable();

  constructor(
    private roleService: RoleService,
    private userService: UserService
  ) {
    this.initializeUserRole();
  }

  private initializeUserRole(): void {
    this.userService.getCurrentUser().pipe(
      switchMap(user => {
        if (!user) return of(null);
        
        // Convert user role to RoleName
        const roleName = this.convertUserRoleToRoleName(user.role);
        return this.roleService.getRoleByName(roleName);
      })
    ).subscribe(role => {
      this.currentUserRoleSubject.next(role);
    });
  }

  private convertUserRoleToRoleName(role: User['role']): RoleName {
    switch (role) {
      case 'admin': return RoleName.ADMIN;
      case 'customer': return RoleName.CUSTOMER;
      case 'inventory_staff': return RoleName.INVENTORY_STAFF;
      case 'logistics_manager': return RoleName.LOGISTICS_MANAGER;
      default: return RoleName.CUSTOMER; // Default fallback
    }
  }

  // Check if current user has permission for a specific resource and action
  hasPermission(resource: ResourceType, permissionType: PermissionType): Observable<boolean> {
    return this.currentUserRole$.pipe(
      map(role => {
        if (!role) return false;
        return this.roleService.hasPermission(role, resource, permissionType);
      })
    );
  }

  // Convenience methods for common permission checks
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

  canList(resource: ResourceType): Observable<boolean> {
    return this.hasPermission(resource, PermissionType.LIST);
  }

  // Reload user role (e.g., after role change)
  reloadUserRole(): void {
    this.initializeUserRole();
  }
}
