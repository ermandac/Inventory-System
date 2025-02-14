import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Role, PermissionType, ResourceType } from '@core/models/role.model';
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
      switchMap(user => 
        user ? this.roleService.getRoleById(user.roleId) : of(null)
      )
    ).subscribe(role => {
      this.currentUserRoleSubject.next(role);
    });
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
