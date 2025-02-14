import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Role, PermissionType } from '@core/models/role.model';
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
  hasPermission(resource: string, permissionType: PermissionType): Observable<boolean> {
    return this.currentUserRole$.pipe(
      map(role => {
        if (!role) return false;
        return this.roleService.hasPermission(role, resource, permissionType);
      })
    );
  }

  // Check if current user can create a resource
  canCreate(resource: string): Observable<boolean> {
    return this.hasPermission(resource, PermissionType.CREATE);
  }

  // Check if current user can read a resource
  canRead(resource: string): Observable<boolean> {
    return this.hasPermission(resource, PermissionType.READ);
  }

  // Check if current user can update a resource
  canUpdate(resource: string): Observable<boolean> {
    return this.hasPermission(resource, PermissionType.UPDATE);
  }

  // Check if current user can delete a resource
  canDelete(resource: string): Observable<boolean> {
    return this.hasPermission(resource, PermissionType.DELETE);
  }

  // Reload user role (e.g., after role change)
  reloadUserRole(): void {
    this.initializeUserRole();
  }
}
