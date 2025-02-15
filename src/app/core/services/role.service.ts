import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Role, RoleName, Permission, PermissionType, DEFAULT_ROLES } from '@core/models/role.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  getAllRoles(): Observable<Role[]> {
    console.log('[RoleService] Fetching all roles');
    return this.http.get<Role[]>(this.apiUrl).pipe(
      tap(roles => console.log('[RoleService] Roles found:', roles))
    );
  }

  getRoleById(id: string): Observable<Role> {
    console.log(`[RoleService] Fetching role with id: ${id}`);
    return this.http.get<Role>(`${this.apiUrl}/${id}`).pipe(
      tap(role => console.log(`[RoleService] Role found for ${id}:`, role)),
      catchError(error => {
        console.error(`[RoleService] Error fetching role for ${id}:`, error);
        throw error;
      })
    );
  }

  getRoleByName(name: RoleName): Observable<Role | null> {
    // Convert RoleName enum to query-friendly string
    const queryName = name.toLowerCase().replace(/_/g, ' ');
    console.log(`[RoleService] Fetching role with name: ${queryName}`);
    
    return this.http.get<Role[]>(`${this.apiUrl}?name=${queryName}`).pipe(
      tap(roles => {
        console.log(`[RoleService] Roles found for ${queryName}:`, roles);
      }),
      map(roles => roles.length > 0 ? roles[0] : null),
      catchError(error => {
        console.error(`[RoleService] Error fetching role for ${queryName}:`, error);
        return of(null);
      })
    );
  }

  createRole(role: Role): Observable<Role> {
    console.log(`[RoleService] Creating role:`, role);
    return this.http.post<Role>(this.apiUrl, role).pipe(
      tap(createdRole => console.log(`[RoleService] Role created:`, createdRole)),
      catchError(error => {
        console.error(`[RoleService] Error creating role:`, error);
        throw error;
      })
    );
  }

  updateRole(role: Role): Observable<Role> {
    console.log(`[RoleService] Updating role:`, role);
    return this.http.put<Role>(`${this.apiUrl}/${role._id}`, role).pipe(
      tap(updatedRole => console.log(`[RoleService] Role updated:`, updatedRole)),
      catchError(error => {
        console.error(`[RoleService] Error updating role:`, error);
        throw error;
      })
    );
  }

  deleteRole(id: string): Observable<void> {
    console.log(`[RoleService] Deleting role with id: ${id}`);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log(`[RoleService] Role deleted: ${id}`)),
      catchError(error => {
        console.error(`[RoleService] Error deleting role:`, error);
        throw error;
      })
    );
  }

  // Check if a role has a specific permission
  hasPermission(role: Role, resource: string, permissionType: PermissionType): boolean {
    return role.permissions.some(
      permission => 
        permission.resource === resource && 
        permission.type === permissionType
    );
  }

  // Initialize default roles if not exist
  initializeDefaultRoles(): Observable<Role[]> {
    console.log('[RoleService] Initializing default roles');
    return this.getAllRoles().pipe(
      map(existingRoles => {
        const rolesToCreate = DEFAULT_ROLES.filter(
          defaultRole => !existingRoles.some(
            existingRole => existingRole.name === defaultRole.name
          )
        );
        
        return rolesToCreate;
      }),
      tap(rolesToCreate => console.log('[RoleService] Roles to create:', rolesToCreate)),
      map(rolesToCreate => {
        // Create roles that don't exist
        rolesToCreate.forEach(role => {
          this.createRole(role).subscribe();
        });
        
        return rolesToCreate;
      })
    );
  }

  // Get default role (fallback to first role if no default)
  getDefaultRole(): Observable<Role | null> {
    console.log('[RoleService] Getting default role');
    return this.getRoleByName(RoleName.ADMIN).pipe(
      catchError(() => 
        this.getAllRoles().pipe(
          map(roles => roles.length > 0 ? roles[0] : null)
        )
      )
    );
  }
}
